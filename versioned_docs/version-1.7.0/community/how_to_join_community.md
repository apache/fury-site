---
title: How to join Apache Fory™
sidebar_position: 0
id: how_to_join_community
---

First of all, kudos to you for choosing to join the open source contribution ranks. Secondly, we are very grateful that you have chosen to participate in the Fory community and contribute to this open source project.

## Fory Contribution Guide

The Fory team usually conducts development and issue maintenance on GitHub. Please open the [GitHub website](https://github.com/), click the `Sign up` button in the upper right corner, register your own account, and take the first step of your open source journey.

In the [Fory repository](https://github.com/apache/fory), we have a [guide](https://fory.apache.org/zh-CN/docs/community/) for all open source contributors, introducing contents such as version management and branch management. **Please take a few minutes to read and understand it**.

## Your First Pull Request

### Step 0: Install Git

Git is a version control system used to track and manage code changes in software development projects. It helps developers record and manage the history of the code, facilitating team collaboration, code version control, code merging, and other operations. With Git, you can track each version of each file and easily switch and compare between different versions. Git also provides branch management functionality, allowing multiple concurrent development tasks to be carried out simultaneously.

- Visit the official Git website: [https://git-scm.com/] (https://git-scm.com/)
- Download the latest version of the Git installer.
- Run the downloaded installer and follow the prompts of the installation wizard to install.
- After the installation is complete, you can use the `git version` command in the command line to confirm the successful installation.

### Step 1: Fork the Project

- First, you need to fork this project. Enter the [Fory project page](https://github.com/apache/fory), and click the Fork button in the upper right corner.
- In your GitHub account, the project xxxx (your GitHub username)/fory will appear.
- On your local computer, use the following commands to obtain a fory folder:

```
// ssh
git clone git@github.com:xxxx (your GitHub username)/fory.git
// https
git clone https://github.com/xxxx (your GitHub username)/fory.git
```

### Step 2: Obtain the Project Code

- Enter the fory folder and add the remote address of fory:

```
git remote add upstream https://github.com/apache/fory.git
```

### Step 3: Create a Branch

- Alright, now you can start contributing our code. The default branch of Fory is the main branch. Whether it is for function development, bug fixes, or documentation writing, please create a new branch and then merge it to the main branch. Use the following code to create a branch:

```
// Create a function development branch
git checkout -b feat/xxxx

// Create a problem-fixing development branch
git checkout -b fix/xxxx

// Create a documentation, demo branch
git checkout -b docs/add-java-demo
```

Suppose we have created the documentation modification branch `docs/add-java-demo` and we have added some code and submitted it to the code repository.

- `git add .`
- `git commit -a -m "docs: add java demo and related docs"`

### Step 4: Merge the Modifications

- Switch back to your development branch:

```
git checkout docs/add-java-demo
```

- Submit the updated code to your branch:

```
git push origin docs/add-java-demo
```

### Step 5: Submit a Pull Request

You can click the `Compare & pull request` button on your GitHub code repository page. Or create it through the `contribute` button.

- Fill in what type of modification this is.
- Fill in the associated issue.
- If there are complex changes, please explain the background and solution.

After filling in the relevant information, click Create pull request to submit.

## **Easily Step into the Fory Open Source Contribution Journey**

"**good first issue**" is a common label in the open source community, and the purpose of this label is to help new contributors find entry-level issues that are suitable for them.

The entry-level issues of Fory can be viewed through the [issue list](https://github.com/apache/fory/issues).

If you currently **have the time and willingness** to participate in community contributions, you can take a look at **good first issue** in the issues and select one that interests you and is suitable for you to claim.

## Embrace the Apache Fory™ Community

While you contribute code to Fory, we encourage you to participate in other things that make the community more prosperous, such as:

- Offer suggestions for the project's development, functional planning, etc.
- Create articles, videos, and hold lectures to promote Fory.
- Write promotion plans and execute them together with the team.
