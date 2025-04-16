
// Format dates to be more readable
export function formatEventDates() {
    // Format created dates
    document.querySelectorAll('.user-meta .time').forEach(timeElement => {
      const dateStr = timeElement.textContent.trim();
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date)) {
            timeElement.textContent = formatDate(date);
          }
        } catch (e) {
          console.error("Error formatting created date:", e);
        }
      }
    });
  
    // Format scheduled event dates
    document.querySelectorAll('.event-date').forEach(dateElement => {
      const iconSpan = dateElement.querySelector('.icon');
      const dateText = dateElement.textContent.replace(iconSpan?.textContent || '', '').trim();
      
      if (dateText) {
        try {
          const date = new Date(dateText);
          if (!isNaN(date)) {
            // Keep the icon but replace the text
            dateElement.innerHTML = `${iconSpan?.outerHTML || ''} ${formatDate(date, true)}`;
          }
        } catch (e) {
          console.error("Error formatting scheduled date:", e);
        }
      }
    });
  }
  
  // Helper function to format date in a human-readable way
  function formatDate(date, includeTime = false) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();
    
    const options = {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };
    
    if (!isThisYear) {
      options.year = 'numeric';
    }
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    let formattedDate = date.toLocaleDateString('en-US', options);
    
    if (isToday) {
      if (includeTime) {
        formattedDate = `Today at ${date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;
      } else {
        formattedDate = 'Today';
      }
    }
    
    return formattedDate;
  }