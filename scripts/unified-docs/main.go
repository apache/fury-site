//  Licensed to the Apache Software Foundation (ASF) under one
//  or more contributor license agreements.  See the NOTICE file
//  distributed with this work for additional information
//  regarding copyright ownership.  The ASF licenses this file
//  to you under the Apache License, Version 2.0 (the
//  "License"); you may not use this file except in compliance
//  with the License.  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing,
//  software distributed under the License is distributed on an
//  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
//  KIND, either express or implied.  See the License for the
//  specific language governing permissions and limitations
//  under the License.

package main

// This is the main entry point for the unified-docs script.

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
)

// FolderCompareTask represents a task to compare two folders.
type FolderCompareTask struct {
	SrcFolder string
	DstFolder string
	Stages    []FolderCompareStage
}

// FolderCompareStage represents a stage in a folder comparison task.
type FolderCompareStage struct {
	Title func()
	Task  func(task *FolderCompareTask)
}

// Execute executes the folder comparison task.
func (task *FolderCompareTask) Execute() {
	for _, stage := range task.Stages {
		stage.Title()
		stage.Task(task)
	}
}

const (
	baseFolderConst = "../../i18n/"
	blogFolderConst = "docusaurus-plugin-content-blog/"
	docsFolderConst = "docusaurus-plugin-content-docs/current/"
	SrcFolderConst  = baseFolderConst + "en-us/"
	DstFolderConst  = baseFolderConst + "zh-cn/"
)

func main() {

	srcFolders := []string{
		SrcFolderConst + blogFolderConst,
		SrcFolderConst + docsFolderConst,
	}
	dstFolders := []string{
		DstFolderConst + blogFolderConst,
		DstFolderConst + docsFolderConst,
	}

	if currentDir, err := os.Getwd(); err != nil {
		fmt.Println("current work dir:", currentDir)
		return
	}

	// Create the destination folder if it doesn't exist
	for _, dstFolder := range dstFolders {
		if _, err := os.Stat(dstFolder); os.IsNotExist(err) {
			err = os.MkdirAll(dstFolder, 0755)
			if err != nil {
				fmt.Printf("Error creating destination folder %s: %v\n", dstFolder, err)
				return
			}
			fmt.Printf("destination folder check pass. %s\n", dstFolder)
		}
	}

	var wg sync.WaitGroup

	for idx, srcFolder := range srcFolders {
		dstFolder := dstFolders[idx]
		// Check if the source folder exists
		if _, err := os.Stat(srcFolder); os.IsNotExist(err) {
			fmt.Printf("Source folder %s does not exist, skipping. err: %v\n", srcFolder, err.Error())
			continue
		}

		wg.Add(1)
		go func(srcFolder, dstFolder string) {
			defer wg.Done()

			task := &FolderCompareTask{
				SrcFolder: srcFolder,
				DstFolder: dstFolder,
				Stages: []FolderCompareStage{
					{
						Title: func() { fmt.Printf("Stage 1: Comparing folder %s\n", srcFolder) },
						Task:  compareFolder,
					},
					{
						Title: func() { fmt.Printf("Stage 2: Copying missing files from %s\n", srcFolder) },
						Task:  copyFiles,
					},
				},
			}

			task.Execute()
		}(srcFolder, dstFolder)
	}

	wg.Wait()
}

func compareFolder(task *FolderCompareTask) {

	err := filepath.Walk(task.SrcFolder, func(srcPath string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		dstPath := filepath.Join(task.DstFolder, info.Name())
		fmt.Println("srcPath:", srcPath)
		fmt.Println("dstPath:", dstPath)
		_, err = os.Stat(dstPath)
		if os.IsNotExist(err) {
			fmt.Printf("File to be copied: %s -> %s, err: %v\n", srcPath, dstPath, err.Error())
		}

		return nil
	})

	if err != nil {
		fmt.Printf("Error comparing folders: %v\n", err)
	}
}

func copyFiles(task *FolderCompareTask) {

	err := filepath.Walk(task.SrcFolder, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calculate the relative path
		relPath, err := filepath.Rel(task.SrcFolder, path)
		if err != nil {
			return err
		}

		// Create destination path
		dstPath := filepath.Join(task.DstFolder, relPath)

		if info.IsDir() {
			// Create directory
			err = os.MkdirAll(dstPath, info.Mode())
			if err != nil {
				return err
			}
		} else {
			// Copy file
			return copyFile(path, dstPath)
		}

		return nil
	})

	if err != nil {
		fmt.Printf("Error copying files: %v\n", err)
	}
}

func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destinationFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destinationFile.Close()

	_, err = io.Copy(destinationFile, sourceFile)
	if err != nil {
		return err
	}

	return nil
}
