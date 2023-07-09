import { Status, TreeNode } from '../types';
import { icWithLocale } from './hooks';


export const filterTreeNode = (
  treeNode: TreeNode,
  keyValue: string,
  locale: string,
) => {
  if (treeNode.childrenKey && Array.isArray(treeNode[treeNode.childrenKey])) {
    const children = treeNode[treeNode.childrenKey] as TreeNode[];
    const filteredChildren = children.filter((child) => {
      const c = filterTreeNode(child, keyValue, locale);
      return c !== null;
    });

    if (filteredChildren.length > 0) {
      treeNode[treeNode.childrenKey] = [...filteredChildren];
      return treeNode;
    }
  }

  const title = icWithLocale(treeNode.title, locale) || '';
  const matchFields = [title, treeNode.id, treeNode.filename];
  
  const isCurrentTreeNodeMatched = 
    matchFields.some(f => (f ? f.toLowerCase() : '').includes(keyValue ? keyValue.toLowerCase() : ''));

  // 当前节点自身匹配，那么其孩子直接匹配，可以直接返回当前节点
  if (isCurrentTreeNodeMatched) {
    return treeNode;
  }

  return null;
};
