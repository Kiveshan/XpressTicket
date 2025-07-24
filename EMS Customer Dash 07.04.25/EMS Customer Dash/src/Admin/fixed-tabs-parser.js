// properly parses tabs from PostgreSQL array format
const parseTabsFromPostgres = (data) => {
  if (!data.tabs || !Array.isArray(data.tabs)) {
    return data.tab_num > 0 ? [{ name: data.tab_name || 'Tab', content: data.tab_content || '' }] : [];
  }
  
  return data.tabs.map(tab => {
    if (typeof tab === 'string') {
      console.log('Processing tab string:', tab);
      
      // First check if it's the specific format //
      const simpleFormat = /"name":"([^"]+)","content":"([^"]+)"/;
      const simpleMatch = tab.match(simpleFormat);
      if (simpleMatch) {
        return { 
          name: simpleMatch[1], 
          content: simpleMatch[2] 
        };
      }
      
      try {
        // Try direct JSON parsing first
        const parsedTab = JSON.parse(tab);
        return { 
          name: parsedTab.name || 'Tab', 
          content: parsedTab.content || 'No content' 
        };
      } catch (e) {
        // If direct parsing fails
        try {
          // Handle PostgreSQL character varying[] format
          // Remove any PostgreSQL array formatting and escape characters
          let cleanTab = tab
            .replace(/^\{|\}$/g, '')      // Remove outer braces
            .replace(/\\"/g, '"')       // Replace escaped quotes
            .replace(/^"|"$/g, '');   // Remove outer quotes
          
          // Try to add proper JSON braces if needed
          if (!cleanTab.startsWith('{')) {
            cleanTab = '{' + cleanTab + '}';
          }
          
          const parsedTab = JSON.parse(cleanTab);
          return { 
            name: parsedTab.name || 'Tab', 
            content: parsedTab.content || 'No content' 
          };
        } catch (innerError) {
          console.error('Error parsing tab after cleaning:', innerError, tab);
          
          // Last resort - use regex to extract name and content
          const nameMatch = tab.match(/name["\\s:]+([^",}]+)/);
          const contentMatch = tab.match(/content["\\s:]+([^",}]+)/);
          
          return { 
            name: nameMatch ? nameMatch[1] : 'Tab', 
            content: contentMatch ? contentMatch[1] : tab.replace(/["{}[\]]/g, '')
          };
        }
      }
    }
    
    // Tab is already an object
    return { 
      name: tab.name || 'Tab', 
      content: tab.content || 'No content' 
    };
  });
};
