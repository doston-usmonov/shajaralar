import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const FamilyTreeView = ({ data }) => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef();
  // Keep track of expanded/collapsed nodes
  const [expandedNodes, setExpandedNodes] = useState({});
  // Track current centered node ID
  const [centeredNodeId, setCenteredNodeId] = useState(null);
  // Store the current root node ID (for re-rooting the tree)
  const [rootNodeId, setRootNodeId] = useState(data?.id || null);
  // Current tree data state (can be modified by re-rooting)
  const [treeData, setTreeData] = useState(data);
  // For debugging - log errors and results
  const [apiStatus, setApiStatus] = useState(null);
  // Track fullscreen status
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setTreeData(data);
    setRootNodeId(data?.id || null);
  }, [data]);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: Math.max(height, 600) });
    }

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: Math.max(height, 600) });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: prev[nodeId] === false ? true : false
    }));
  };

  // Focus/center on a specific node - now just centers the view
  const centerOnNode = (nodeId) => {
    setCenteredNodeId(nodeId);
  };

  // Make a node the new root of the tree
  const makeNodeRoot = async (nodeId) => {
    if (!nodeId || nodeId === rootNodeId) return;

    try {
      setApiStatus(`Fetching tree for person ${nodeId}...`);
      
      // Add the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setApiStatus('Error: No authentication token found');
        return;
      }
      
      // Fetch the person's tree data from the backend
      const response = await fetch(`/api/people/${nodeId}/tree`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setApiStatus(`API error: ${response.status} - ${errorText}`);
        console.error('Failed to fetch tree data', response.status, errorText);
        return;
      }
      
      const newTreeData = await response.json();
      setApiStatus(`Success: Loaded new tree data for person ${nodeId}`);
      
      // Update the tree data with new root
      setTreeData(newTreeData);
      setRootNodeId(nodeId);
      
      // Reset expanded nodes state for the new tree
      setExpandedNodes({});
      
      // Center on the new root
      setCenteredNodeId(nodeId);
    } catch (error) {
      setApiStatus(`Error: ${error.message}`);
      console.error('Error making node root:', error);
    }
  };

  // Helper function to check if a node has children (deeply)
  const hasChildren = (node) => {
    if (!node) return false;
    if (node.children && node.children.length > 0) return true;
    return false;
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .catch(err => {
            setApiStatus(`Error attempting to enable fullscreen: ${err.message}`);
          });
      } else if (containerRef.current.webkitRequestFullscreen) { /* Safari */
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) { /* IE11 */
        containerRef.current.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    if (!treeData || !dimensions.width || !dimensions.height) return;

    // Clear all previous content
    const svgElement = svgRef.current;
    while (svgElement.firstChild) {
      svgElement.removeChild(svgElement.firstChild);
    }

    // Setup the tree visualization
    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const g = svg.append("g")
      .attr("class", "tree-container");

    // Create hierarchy from original data
    const root = d3.hierarchy(treeData);
    
    // Process the data according to expanded/collapsed state
    function processData(rootNode) {
      if (!Object.keys(expandedNodes).length) {
        // Initialize all nodes as expanded on first render
        rootNode.descendants().forEach(node => {
          if (node.data && node.data.id) {
            expandedNodes[node.data.id] = true;
          }
        });
        setExpandedNodes({...expandedNodes});
      } else {
        // Filter children based on expanded status
        const processNode = (node) => {
          if (node.data && node.data.id && expandedNodes[node.data.id] === false) {
            // If this node is collapsed, don't show its children
            node.children = null;
          } else if (node.children) {
            // Process children recursively
            node.children.forEach(processNode);
          }
        };
        
        // Start processing from root
        processNode(rootNode);
      }
      return rootNode;
    }
    
    // Process the data based on expanded state
    const processedRoot = processData(root);
    
    // Create tree layout
    const treeLayout = d3.tree()
      .size([dimensions.width - 120, dimensions.height - 180])
      .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));
    
    // Apply layout to processed data
    const layoutData = treeLayout(processedRoot);

    // Draw links between nodes
    g.selectAll(".link")
      .data(layoutData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y))
      .attr("fill", "none")
      .attr("stroke", "#A0AEC0")
      .attr("stroke-width", 1.5);

    // Create node groups
    const nodeGroups = g.selectAll(".node")
      .data(layoutData.descendants())
      .enter()
      .append("g")
      .attr("class", d => `node ${d.data.id === centeredNodeId ? 'centered-node' : ''} ${d.data.id === rootNodeId ? 'root-node' : ''}`)
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .attr("data-id", d => d.data.id || '');

    // Node circles - clicking on these will make this node the new root
    nodeGroups.append("circle")
      .attr("r", 25)
      .attr("fill", d => {
        if (d.data.id === rootNodeId) return "#FED7D7"; // Root node - light red
        if (d.data.id === centeredNodeId) return "#E6FFFA"; // Centered node - light teal
        return "#EBF4FF"; // Normal node - light blue
      })
      .attr("stroke", d => {
        if (d.data.id === rootNodeId) return "#E53E3E"; // Root node - red
        if (d.data.id === centeredNodeId) return "#38B2AC"; // Centered node - teal
        return "#4299E1"; // Normal node - blue
      })
      .attr("stroke-width", d => (d.data.id === rootNodeId || d.data.id === centeredNodeId) ? 3 : 2)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        if (d.data && d.data.id) {
          // Make this node the new root of the tree
          makeNodeRoot(d.data.id);
        }
      });

    // Add expansion indicator (+/-) if node has children
    nodeGroups.each(function(d) {
      // Check if node has children in the data
      const node = d3.select(this);
      const nodeData = d.data;
      
      if (nodeData && nodeData.children && nodeData.children.length > 0) {
        // Has children - show +/- indicator
        const isExpanded = expandedNodes[nodeData.id] !== false;
        
        node.append("text")
          .attr("x", 0)
          .attr("y", -35)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .attr("font-weight", "bold")
          .attr("fill", "#4299E1")
          .text(isExpanded ? "−" : "+")
          .attr("class", "toggle-indicator")
          .style("cursor", "pointer")
          .on("click", function(event) {
            event.stopPropagation();
            if (nodeData && nodeData.id) {
              // Toggle expand/collapse
              toggleNode(nodeData.id);
            }
          });
      }
    });

    // Add root indicator
    nodeGroups.each(function(d) {
      if (d.data.id === rootNodeId) {
        const node = d3.select(this);
        
        node.append("text")
          .attr("x", 0)
          .attr("y", -35)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#E53E3E")
          .text("ROOT");
      }
    });

    // Text background
    nodeGroups.append("rect")
      .attr("x", -45)
      .attr("y", 30)
      .attr("width", 90)
      .attr("height", 20)
      .attr("rx", 5)
      .attr("fill", "white")
      .attr("fill-opacity", 0.9)
      .attr("stroke", "#E2E8F0")
      .attr("stroke-width", 1);

    // Name labels - clicking on these will navigate to person detail
    nodeGroups.append("text")
      .attr("dy", 45)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text(d => {
        if (!d.data || !d.data.full_name) return '';
        const name = d.data.full_name.split(' ')[0];
        return name.length > 10 ? name.substring(0, 8) + '...' : name;
      })
      .attr("fill", "#2D3748")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        if (d.data && d.data.id) {
          // Navigate to person detail page
          window.location.href = `/person/${d.data.id}`;
        }
      });

    // Initials inside circles
    nodeGroups.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(d => {
        if (!d.data || !d.data.full_name) return '';
        return d.data.full_name.charAt(0);
      })
      .attr("fill", d => {
        if (d.data.id === rootNodeId) return "#E53E3E"; // Root node - red
        if (d.data.id === centeredNodeId) return "#38B2AC"; // Centered node - teal
        return "#4299E1"; // Normal node - blue
      });

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Count total nodes for better sizing
    const totalNodes = countNodes(treeData);
    
    // Set initial zoom and position
    const initialScale = totalNodes > 15 ? 0.6 : (totalNodes > 8 ? 0.7 : 0.8);
    
    // If a specific node is centered, focus on it
    if (centeredNodeId) {
      const centeredNode = layoutData.descendants().find(d => d.data.id === centeredNodeId);
      if (centeredNode) {
        // Use smooth transition to center on this node
        const transform = d3.zoomIdentity
          .translate(dimensions.width / 2 - centeredNode.x * initialScale, 
                    dimensions.height / 2 - centeredNode.y * initialScale)
          .scale(initialScale);
        
        svg.transition()
          .duration(750)
          .call(zoom.transform, transform);
      } else {
        // Default position if centered node not found
        const transform = d3.zoomIdentity
          .translate(dimensions.width / 2, 80)
          .scale(initialScale)
          .translate(-dimensions.width / 3, 0);
        
        svg.call(zoom.transform, transform);
      }
    } else {
      // Default position
      const transform = d3.zoomIdentity
        .translate(dimensions.width / 2, 80)
        .scale(initialScale)
        .translate(-dimensions.width / 3, 0);
      
      svg.call(zoom.transform, transform);
    }

  }, [treeData, dimensions, expandedNodes, centeredNodeId, rootNodeId]);

  // Helper function to count nodes
  function countNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += countNodes(child);
      });
    }
    return count;
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative ${isFullscreen ? 'w-screen h-screen' : 'w-full h-full min-h-[600px]'}`}
    >
      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
          onClick={toggleFullscreen}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg w-10 h-10 flex items-center justify-center"
          title={isFullscreen ? "Exit Full Screen" : "View Full Screen"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a1 1 0 0 0-1 1v3.5a.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5V5a2 2 0 0 1 2-2h3.5a.5.5 0 0 1 0 1H5zm10 10a1 1 0 0 0 1-1v-3.5a.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5V13a2 2 0 0 1-2 2h-3.5a.5.5 0 0 1 0-1H15z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H6.414l2.293 2.293a1 1 0 1 1-1.414 1.414L5 6.414V8a1 1 0 0 1-2 0V4zm9 1a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V6.414l-2.293 2.293a1 1 0 1 1-1.414-1.414L13.586 5H12zm-9 7a1 1 0 0 1 2 0v1.586l2.293-2.293a1 1 0 0 1 1.414 1.414L6.414 15H8a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1v-4zm13-1a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h1.586l-2.293-2.293a1 1 0 0 1 1.414-1.414L15 13.586V12z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      {apiStatus && (
        <div className="bg-gray-700 text-white text-xs p-2 absolute bottom-2 left-2 rounded opacity-70">
          {apiStatus}
        </div>
      )}
      <style>{`
        .centered-node circle {
          filter: drop-shadow(0 0 5px rgba(56, 178, 172, 0.5));
        }
        
        .root-node circle {
          filter: drop-shadow(0 0 5px rgba(229, 62, 62, 0.5));
        }
        
        .toggle-indicator {
          cursor: pointer !important;
          user-select: none;
        }
        
        /* Fullscreen specific styles */
        .family-tree-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          background: white;
        }
      `}</style>
    </div>
  );
};

export default FamilyTreeView;
