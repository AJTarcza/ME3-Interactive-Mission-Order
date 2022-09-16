//Name for the node list in local storage
const NODE_LIST_KEY = "nodeList";

/**
 Stringify and store the node list in local storage
*/
function storeNodeList() {
	var nodes = document.querySelectorAll(UNFINISHED_NODE_CLASS + "," + FINISHED_NODE_CLASS);
	var strVal = JSON.stringify([...nodes].map(node => node.classList.value));
	
	window.localStorage.setItem(NODE_LIST_KEY, strVal);
}

/**
 Applies a given node list's values to the document's nodes
 
 @param:
	nodeList: The list of nodes to apply to the document
*/
function applyNodeList(nodeList) {
	var nodes = document.querySelectorAll(UNFINISHED_NODE_CLASS + "," + FINISHED_NODE_CLASS);
	
	var id = 0;
	nodes.forEach(node => {
		setState(node, nodeList[id++]);
	});
	
	var headers = document.querySelectorAll(SECTION_HEADER_CLASS);
	headers.forEach(header => {
		checkSectionStatus(header);
	});
}

/**
 Reads the node list from local storage
*/
function readNodeList() {
	return JSON.parse(window.localStorage.getItem(NODE_LIST_KEY));
}