
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
 // Update this function to use Ukrainian timezone
 export function formatRelativeDate(dateString) {
  // Ensure we have a valid date string
  if (!dateString) return 'Unknown date';
  
  let commentDate;
  try {
      // Parse the date string - this will be in UTC if it's from the server
      commentDate = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(commentDate.getTime())) {
          console.error('Invalid date:', dateString);
          return 'Invalid date';
      }
  } catch (e) {
      console.error('Error parsing date:', e);
      return 'Invalid date';
  }
  
  // Get current time
  const now = new Date();
  commentDate.setHours(commentDate.getHours() + 3)

  // Calculate difference in seconds between now and comment time
  // No timezone adjustment needed as both dates are in the same timezone context
  const diffInSeconds = Math.floor((now - commentDate) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
      return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // For older comments, show the date in Ukraine format and timezone
  return new Intl.DateTimeFormat('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Kiev'
  }).format(commentDate);
}

// For ISO date formatting - kept simple since it's just for the datetime attribute
export function formatISODate(dateString) {
  if (!dateString) return '';
  
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Return ISO 8601 format for datetime attribute
      return date.toISOString();
  } catch (e) {
      console.error('Error formatting ISO date:', e);
      return '';
  }
}

// Helper function to format date in a human-readable way with Ukraine timezone
function formatDate(date, includeTime = false) {
  const now = new Date();
  
  // Adjust dates to Ukraine timezone
  const isUkraineSummerTime = isDateInUkraineDST(now);
  const ukraineOffset = isUkraineSummerTime ? 180 : 120; // minutes
  
  // Create dates in Ukraine timezone for comparison
  const adjustedNow = new Date(now.getTime() + (ukraineOffset - now.getTimezoneOffset()) * 60000);
  const adjustedDate = new Date(date.getTime() + (ukraineOffset - date.getTimezoneOffset()) * 60000);
  
  const isToday = adjustedDate.toDateString() === adjustedNow.toDateString();
  const isThisYear = adjustedDate.getFullYear() === adjustedNow.getFullYear();
  
  const options = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: 'Europe/Kiev'
  };
  
  if (!isThisYear) {
      options.year = 'numeric';
  }
  
  if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
  }
  
  let formattedDate = date.toLocaleDateString('uk-UA', options);
  
  if (isToday) {
      if (includeTime) {
          formattedDate = `Today at ${date.toLocaleTimeString('uk-UA', {
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'Europe/Kiev'
          })}`;
      } else {
          formattedDate = 'Today';
      }
  }
  
  return formattedDate;
}

// Helper function to determine if a date is during Ukraine's Daylight Saving Time
function isDateInUkraineDST(date) {
  // Ukraine's DST rules:
  // - Starts on the last Sunday of March at 3:00 AM (moves to 4:00 AM)
  // - Ends on the last Sunday of October at 4:00 AM (moves to 3:00 AM)
  const year = date.getFullYear();
  
  // Last Sunday of March
  const marchLastDay = new Date(year, 2, 31);
  while (marchLastDay.getDay() !== 0) {
      marchLastDay.setDate(marchLastDay.getDate() - 1);
  }
  
  // Last Sunday of October
  const octoberLastDay = new Date(year, 9, 31);
  while (octoberLastDay.getDay() !== 0) {
      octoberLastDay.setDate(octoberLastDay.getDate() - 1);
  }
  
  // DST starts at 3:00 AM on the last Sunday of March
  const dstStart = new Date(marchLastDay);
  dstStart.setHours(3, 0, 0, 0);
  
  // DST ends at 4:00 AM on the last Sunday of October
  const dstEnd = new Date(octoberLastDay);
  dstEnd.setHours(4, 0, 0, 0);
  
  // Check if the date is in this range
  return date >= dstStart && date < dstEnd;
}