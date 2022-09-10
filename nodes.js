//Identifiers for an unfinished node
const UNFINISHED_NODE_NAME = "unfinishedNode";
const UNFINISHED_NODE_CLASS = "." + UNFINISHED_NODE_NAME;

//Identifiers for an finished node
const FINISHED_NODE_NAME = "finishedNode";
const FINISHED_NODE_CLASS = "." + FINISHED_NODE_NAME;

//Identifiers for a section header
const SECTION_HEADER_NAME = "sectionHeader";
const SECTION_HEADER_CLASS = "." + SECTION_HEADER_NAME;

//Identifiers for a node container
const CONTAINER_NAME = "nodeContainer";
const CONTAINER_CLASS = "." + CONTAINER_NAME;

//Identifiers for a subcontainer
const SUBCONTAINER_NAME = "subContainer";
const SUBCONTAINER_CLASS = "." + SUBCONTAINER_NAME;

//Identifiers for a footnote
const FOOTNOTE_CONTAINER_NAME = "footnoteContainer";

/**
 Programatically assigns ids to every node in the document
*/
function assignNodeIDs() {
	var idx = 0;
	var nodes = document.querySelectorAll(UNFINISHED_NODE_CLASS + "," + FINISHED_NODE_CLASS);
	
	nodes.forEach(node => node.setAttribute("id", idx++));
}

/**
 Programatically assigns onclick methods to every node in the document
*/
function attachOnClickMethods() {
	var containers = document.querySelectorAll(CONTAINER_CLASS);
	
	containers.forEach(container => {
		var children = container.children;
		
		//Check if this is a multi part section
		if(children[0].classList.contains(SECTION_HEADER_NAME)) {
			//Section header
			children[0].onclick = function() {toggleAllChildren(this)};
			
			var subContainers = container.querySelectorAll(SUBCONTAINER_CLASS);
			subContainers.forEach(subContainer => {
				//Fetch this subContainers children
				var subChildren = Array.from(subContainer.children);
				
				for(var i = 0; i < subChildren.length; i++) {
					//If there is a nested subContainer then remove it from the children list and append all of its children for processing
					if(subChildren[i].classList.contains(SUBCONTAINER_NAME)) {
						var temp = subChildren[i].children;
						subChildren.splice(i, 1);
						subChildren.push(...temp);
					}
					
					//If we are dealing with a footnote then just skip it
					if(subChildren[i].classList.contains(FOOTNOTE_CONTAINER_NAME))
						continue;
					
					//If the next element in the list is a footnote then we need to add the updateFootnotes function to this node
					if(subChildren[i + 1] != null && subChildren[i + 1].classList.contains(FOOTNOTE_CONTAINER_NAME)) {
						subChildren[i].onclick = function() {
							toggleState(this, true);
							updateFootnotes(this);
						};
					}
					else
						subChildren[i].onclick = function() {toggleState(this, true)};
				}
			});
		}
		else {
			for(var i = 0; i < children.length; i++) {
				//If we are dealing with a footnote then just skip it
				if(children[i].classList.contains(FOOTNOTE_CONTAINER_NAME))
					continue;
				
				//If the next element in the list is a footnote then we need to add the updateFootnotes function to this node
				if(children[i + 1] != null && children[i + 1].classList.contains(FOOTNOTE_CONTAINER_NAME)) {
					children[i].onclick = function() {
						toggleState(this, false);
						updateFootnotes(children[i]);
					};
				}
				else {
					children[i].onclick = function() {toggleState(this, false)};
				}
			}
		}
	});
}

/**
 Sets up the node IDs and reads the node list from local storage
*/
function setup() {
	assignNodeIDs();
	attachOnClickMethods();
	
	//Fetch the list from local storage
	var localList = localStorage.getItem(NODE_LIST_KEY) != null ? readNodeList() : [];
	
	//Check if the stored list length matches the length of the document's list of nodes. If not, then one or more nodes must have been added/removed since we last stored
	var synced = document.querySelectorAll(UNFINISHED_NODE_CLASS + "," + FINISHED_NODE_CLASS).length == localList.length ? true : false;

	//Both node lists are in sync so we can apply the local list to the document
	if(synced)
		applyNodeList(localList);
	
	//Enable animations for the body
	document.querySelector("body").classList.remove("preload");
}

/**
 Sets a node to a specific state
 
 @params:
	node: The node to set
	state: Text representing the desired state
*/
function setState(node, state) {
	if(state.includes(UNFINISHED_NODE_NAME)) {
		node.classList.remove(FINISHED_NODE_NAME);
		node.classList.add(UNFINISHED_NODE_NAME);
	}
	else {
		node.classList.remove(UNFINISHED_NODE_NAME);
		node.classList.add(FINISHED_NODE_NAME);
	}
	
	updateFootnotes(node);
}

/**
 Toggles a node to its opposite state
 
 @params:
	node: The node to toggle
	notify: Whether or not this node needs to notify its parent section that it was changed
*/
function toggleState(node, notify) {
	if(node.classList.contains(SUBCONTAINER_NAME))
		return;
	
	if(node.classList.contains(UNFINISHED_NODE_NAME)) {
		node.classList.remove(UNFINISHED_NODE_NAME);
		node.classList.add(FINISHED_NODE_NAME);
	}
	else {
		node.classList.remove(FINISHED_NODE_NAME);
		node.classList.add(UNFINISHED_NODE_NAME);
	}
	
	updateFootnotes(node);
	
	if(notify)
		checkSectionStatus(node);
	
	storeNodeList();
}

/**
 Toggles a node to the opposite of a given text state
 
 @params:
	node: The node to toggle
	state: Text representing the current state
*/
function toggleStateFromText(node, state) {
	if(node.classList.contains(SUBCONTAINER_NAME))
		return;
	
	if(state === UNFINISHED_NODE_NAME) {
		node.classList.remove(UNFINISHED_NODE_NAME);
		node.classList.add(FINISHED_NODE_NAME);
	}
	else {
		node.classList.remove(FINISHED_NODE_NAME);
		node.classList.add(UNFINISHED_NODE_NAME);
	}
	
	updateFootnotes(node);
	
	storeNodeList();
}

/**
 Toggles all children of a container node to the same value
 
 @params:
	node: The current node
*/
function toggleAllChildren(node) {
	//Find the container node
	var parent = header = node;
	while(!parent.classList.contains(CONTAINER_NAME)) {
		parent = parent.parentNode;
	}

	var children = parent.querySelectorAll(UNFINISHED_NODE_CLASS + "," + FINISHED_NODE_CLASS);
	var curState = children[0].classList.contains(UNFINISHED_NODE_NAME) ? UNFINISHED_NODE_NAME : FINISHED_NODE_NAME;
	
	//Toggle all children to the same value
	for (var i = 0; i < children.length; i++) {
		if(children[i] != header)
			toggleStateFromText(children[i], curState);
	}
	
	checkSectionStatus(header);
}

/**
 Hides/shows all of the footnotes for a given node based on the node's desired state
 
 @params:
	node: The current node
*/
function updateFootnotes(node) {
	var parent = node.parentNode;
	var children = parent.children;
	
	var curState = node.classList.contains(UNFINISHED_NODE_NAME) ? UNFINISHED_NODE_NAME : FINISHED_NODE_NAME;
	
	var index = -1;
	var toggle = false;
	
	for(var i = 0; i < children.length; i++) {
		//We've found the current node in the child list so from this point on start toggling footnotes
		if(children[i] === node) {
			toggle = true;
			continue;
		}
		
		if(toggle) {
			//Break once we've found something other than a footnote
			if(children[i].classList.contains(SUBCONTAINER_NAME)) {
				break;
			}
			
			//Toggle the footnote's visibility
			if(curState == UNFINISHED_NODE_NAME)
				children[i].style.display = "";
			else
				children[i].style.display = "none";
		}
	}
}

/**
 Sets visibility for all subcontainers in a given container
 
 @params:
	parent: The container for the nodes
	value: Whether or not the subcontainers should be visible
*/
function setSubContainerVisibility(parent, value) {
	var containers = parent.querySelectorAll(SUBCONTAINER_CLASS);
	
	containers.forEach(container => {
		if(value)
			container.style.display = "";
		else
			container.style.display = "none";
	});
}

/**
 Checks if all of the nodes in a given section are the same value so that the header can be automatically switched to that value
 
 @params:
	node: The current node
*/
function checkSectionStatus(node) {
	//Find the container node
	var parent = node;
	while(!parent.classList.contains(CONTAINER_NAME)) {
		parent = parent.parentNode;
	}
	
	var header = parent.querySelectorAll(SECTION_HEADER_CLASS)[0];
	var curState = header.classList.contains(UNFINISHED_NODE_NAME) ? UNFINISHED_NODE_NAME : FINISHED_NODE_NAME;

	var consensus = true;
	
	//Check if all of the child nodes are the same value
	if(curState === UNFINISHED_NODE_NAME)
		consensus = parent.querySelectorAll(UNFINISHED_NODE_CLASS + ":not(" + SECTION_HEADER_CLASS + ")").length == 0 ? true : false;
	else
		consensus = parent.querySelectorAll(UNFINISHED_NODE_CLASS + ":not(" + SECTION_HEADER_CLASS + ")").length >= 1 ? true : false;

	//All nodes match so update the header
	if(consensus)
		toggleStateFromText(header, curState);
	
	if(header.classList.contains(FINISHED_NODE_NAME))
		setSubContainerVisibility(parent, false);
	else
		setSubContainerVisibility(parent, true);
}

/**
 Resets all nodes to the default unfinished state
*/
function resetAllNodes() {
	var nodes = document.querySelectorAll(UNFINISHED_NODE_CLASS + "," + FINISHED_NODE_CLASS);
	nodes.forEach(node => setState(node, UNFINISHED_NODE_NAME));
	
	var headers = document.querySelectorAll(SECTION_HEADER_CLASS);
	headers.forEach(header => checkSectionStatus(header));
	
	storeNodeList();
}

//Run the setup function once the DOM is fully loaded
window.addEventListener('DOMContentLoaded', setup());