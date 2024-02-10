document.addEventListener("DOMContentLoaded", function() {
    let container1Data = {};
    let container2Data = {};
    let initialSelectedDate, secondContainerVisible = false;
    const today = new Date(), tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = flatpickr("#date", {
    altInput: true, altFormat: "d/m/y", locale: "fr", enableTime: false, minDate: today,
    disable: [function(date) {
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }],
    onChange: function(selectedDates) {
    console.log("Date selection changed:", selectedDates.map(date => date.toLocaleDateString()));
  
    if (selectedDates.length > 0) {
    initialSelectedDate = selectedDates[0];
    $(".date-heading").eq(0).text(formatDate(selectedDates[0]));
    updateCheckboxOptions(selectedDates, "container1");
    updateMoreDaysButton(selectedDates);
    }
    
    if (secondContainerVisible) {
    $(".checkbox-container").eq(1).hide();
    $(".date-heading").eq(1).hide();
    secondContainerVisible = false;
    }
    
    if (selectedDates.length > 1) {
    const secondDate = selectedDates[1];
    const secondCheckboxContainer = $(".checkbox-container[data-id='container2']");
    secondCheckboxContainer.html($(".checkbox-container[data-id='container1']").html());
    updateCheckboxOptions([secondDate], "container2");
    $(".date-heading").eq(1).text(formatDate(secondDate));
    $(".date-heading").eq(1).show();
    secondCheckboxContainer.show();
    secondContainerVisible = true;
    }
    
    mergeDataAndUpdateInput();
    }
    });
    
    
    const moreDaysButton = document.querySelector(".moredays");
    moreDaysButton.addEventListener("click", function() {
        console.log("More days button clicked.");
  
    const selectedDates = dateInput.selectedDates;
    if (selectedDates.length > 0 && !initialSelectedDate) {
    initialSelectedDate = selectedDates[0];
    }
    
    if (initialSelectedDate && selectedDates.length < 2) {
    const lastSelectedDate = selectedDates[selectedDates.length - 1];
    const nextDay = new Date(lastSelectedDate);
    nextDay.setDate(lastSelectedDate.getDate() + 1);
    
    dateInput.setDate([...selectedDates, nextDay]);
    const secondCheckboxContainer = $(".checkbox-container").eq(1);
    secondCheckboxContainer.html($(".checkbox-container").eq(0).html());
    updateCheckboxOptions([nextDay], "container2");
    secondCheckboxContainer.show();
    secondContainerVisible = true;
    
    $(".date-heading").eq(1).text(formatDate(nextDay));
    $(".date-heading").eq(1).show();
    }
    });
    
    const firstDateInput = document.querySelector('.firstdateinput');
    document.addEventListener('change', function(event) {
    if ($(event.target).closest('.checkbox-container').length) {
                    console.log("Checkbox change detected in container:", $(event.target).closest('.checkbox-container').data('id'));
  
    const containerId = $(event.target).closest('.checkbox-container').data('id');
    const selectedDates = dateInput.selectedDates;
    updateFirstDateInput(selectedDates, containerId);
    }
    });
    function updateFirstDateInput(selectedDates, containerId) {
      let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
      const dateIndex = containerId === 'container1' ? 0 : 1;
      const selectedDate = selectedDates[dateIndex];
      if (!selectedDate) return;
    
      const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
      const checkboxContainer = $(`.checkbox-container[data-id='${containerId}']`);
    
      const previouslySelectedHours = new Set(); // Track previously selected hours for adjacent logic
      if (dataToUpdate[formattedSelectedDate]) {
        dataToUpdate[formattedSelectedDate].forEach(range => {
          const startHour = parseInt(range.split('h')[0]);
          previouslySelectedHours.add(startHour);
        });
      }
    
      const currentlySelectedHours = new Set(); // Track currently selected hours for adjacent logic
      checkboxContainer.find('.checkbox-hour:checked').each(function() {
        const hour = parseInt(this.value.split(':')[0]);
        currentlySelectedHours.add(hour);
      });
    
      for (let hour = 0; hour < 24; hour++) {
        handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours);
      }
    
      mergeDataAndUpdateInput();
    }
  
  
    function getAdjacentHours(hour) {
      return [(hour - 1 + 24) % 24, (hour + 1) % 24];
    }
    
    function handleTimeSlot(hour, date, data, selectedDate, currentlySelectedHours, previouslySelectedHours) {
  
  
      // Convert selectedDate to a simplified ISO-like date format (YYYY-MM-DD)
      const dateObj = new Date(selectedDate);
      const formattedSelectedDate = dateObj.toISOString().split('T')[0];
  
      // Initialize data[formattedSelectedDate] if it does not exist
      if (!data[formattedSelectedDate]) {
          data[formattedSelectedDate] = [];
      }
  
      const isSelected = currentlySelectedHours.has(hour);
      const selectedHours = Array.from(currentlySelectedHours).sort((a, b) => a - b);
  
      if (isSelected) {
          if (!previouslySelectedHours.has(hour)) {
              addTimeRange(hour, date, data, formattedSelectedDate);
          }
          manageAdjacentHours(selectedHours, date, data, formattedSelectedDate, currentlySelectedHours, previouslySelectedHours);
      } else {
          removeTimeRange(hour, date, data, formattedSelectedDate);
          manageAdjacentHours(selectedHours, date, data, formattedSelectedDate, currentlySelectedHours, previouslySelectedHours, true);
      }
  }
  
  
    
  function manageAdjacentHours(selectedHour, data, selectedDate) {
    // Calculate adjacent hours
    const previousHour = (selectedHour - 1 + 24) % 24;
    const nextHour = (selectedHour + 1) % 24;

    // Adjusted date for handling day transition if necessary
    let { adjustedDate: prevDate } = adjustDateForHourTransition(previousHour, selectedDate);
    let { adjustedDate: nextDate } = adjustDateForHourTransition(nextHour, selectedDate);

    // Formatting dates for consistency
    const prevFormattedDate = prevDate.toISOString().split('T')[0];
    const nextFormattedDate = nextDate.toISOString().split('T')[0];

    // Add adjacent hours if not already included
    if (!isHourIncluded(previousHour, prevFormattedDate, data)) {
        console.log(`Adding adjacent hour ${previousHour} to range for date ${prevFormattedDate}.`);
        addTimeRange(previousHour, prevDate, data);
    }
    if (!isHourIncluded(nextHour, nextFormattedDate, data)) {
        console.log(`Adding adjacent hour ${nextHour} to range for date ${nextFormattedDate}.`);
        addTimeRange(nextHour, nextDate, data);
    }
}

function isHourIncluded(hour, formattedDate, data) {
    // Implement a check to see if the given hour is already included for the date in your data structure
    const timeRange = `${hour}h à ${(hour + 1) % 24}h`;
    return data[formattedDate] && data[formattedDate].includes(timeRange);
}

// Usage within your checkbox change detection logic
// Assuming 'selectedHour' is the hour corresponding to the checkbox change
// and 'selectedDate' is the date the change is being made for
manageAdjacentHours(selectedHour, data, selectedDate);

// Ensure your addTimeRange function correctly handles adding these ranges to 'data'

    
    // Ensure addTimeRange and removeTimeRange are properly implemented to handle adding and removing time ranges.
    
    function formatHour(hour) {
      // Convert hour to integer in case it's a string
      const hourInt = parseInt(hour, 10);
      // Return formatted hour without leading zero if less than 10, else return as is
      return hourInt < 10 ? `${hourInt}` : `${hourInt}`;
  }
  
  // Helper function to adjust dates for time slots that may require transitioning to a different day
function adjustDateForHourTransition(hour, selectedDate) {
  let date = new Date(selectedDate);

  // Adjust for the transition from the previous day to the selected day at midnight
  if (hour === 0) {
      // This example keeps the hour at the start of the selected day.
      // Adjust this logic if you need to attribute the time slot to the end of the previous day
  } else if (hour === 24) {
      // Example adjustment for a scenario where you might have a 24-hour time slot
      date.setDate(date.getDate() + 1);
      hour = 0; // Reset hour to midnight of the next day
  }

  return { adjustedDate: date, adjustedHour: hour };
}

// Function to add a time range to the data structure
function addTimeRange(hour, selectedDate, data) {
  const { adjustedDate, adjustedHour } = adjustDateForHourTransition(hour, selectedDate);
  const formattedDate = adjustedDate.toISOString().split('T')[0];
  const timeRange = `${adjustedHour}h à ${(adjustedHour + 1) % 24}h`;

  if (!data[formattedDate]) {
      data[formattedDate] = [];
  }
  if (!data[formattedDate].includes(timeRange)) {
      data[formattedDate].push(timeRange);
  }
}

// Function to remove a time range from the data structure
function removeTimeRange(hour, selectedDate, data) {
  const { adjustedDate } = adjustDateForHourTransition(hour, selectedDate);
  const formattedDate = adjustedDate.toISOString().split('T')[0];
  const timeRange = `${hour}h à ${(hour + 1) % 24}h`;

  if (data[formattedDate]) {
      const index = data[formattedDate].indexOf(timeRange);
      if (index !== -1) {
          data[formattedDate].splice(index, 1);
      }
  }
}

// Example usage of the functions
let data = {};
let selectedDate = "2024-02-17"; // Example selected date

// Simulating adding a time range
addTimeRange(23, selectedDate, data); // Adding a time range for 23:00 to 24:00 on the selected date

// Simulating removing a time range
removeTimeRange(23, selectedDate, data); // Removing the time range for 23:00 to 24:00 on the selected date

console.log(data);

  
  function adjustDateForHour(hour, date) {
      let newDate = new Date(date);
      if (hour < 0) {
          newDate.setDate(date.getDate() - 1);
          hour = 23;
      } else if (hour > 23) {
          newDate.setDate(date.getDate() + 1);
          hour = 0;
      }
      return newDate;
  }
  
  function removeRangeFromData(hour, date, data) {
      const formattedDate = formatDateKey(date);
      const timeRange = formatTimeRange(hour);
      if (data[formattedDate]) {
          const index = data[formattedDate].indexOf(timeRange);
          if (index !== -1) {
              data[formattedDate].splice(index, 1);
          }
      }
  }
  
  function formatDateKey(date) {
      return date.toISOString().split('T')[0];
  }
  
  function formatTimeRange(hour) {
      return `${hour}h à ${(hour + 1) % 24}h`;
  }
  
  function isAdjacentToSelected(hour, data, date) {
      // This function checks if the hour is adjacent to any selected hour in the data
      // Assuming data is structured as { 'YYYY-MM-DD': ['hour range', ...] }
      const formattedDate = formatDateKey(date);
      const hourRanges = data[formattedDate] || [];
      const previousHourRange = formatTimeRange((hour - 1 + 24) % 24);
      const nextHourRange = formatTimeRange((hour + 1) % 24);
  
      // Check if either the previous or next hour range exists in the data
      return hourRanges.includes(previousHourRange) || hourRanges.includes(nextHourRange);
  }
  
  
  
  
    function mergeDataAndUpdateInput() {
    let mergedData = {};
    
    const existingData = getExistingData();
    let allDates = new Set([...Object.keys(container1Data), ...Object.keys(container2Data), ...Object.keys(existingData)]);
    
    allDates.forEach(date => {
    let dataFromContainer1 = container1Data[date] || [];
    let dataFromContainer2 = container2Data[date] || [];
    let existingDataForDate = existingData[date] || [];
    
    mergedData[date] = [...new Set([...dataFromContainer1, ...dataFromContainer2, ...existingDataForDate])];
    });
    
    
    for (let date in mergedData) {
    if (mergedData[date].length === 0) {
    delete mergedData[date];
    }
    }
    
    $('.firstdateinput').val(JSON.stringify(mergedData));
    }
    
    function getExistingData() {
    const existingDataElement = document.querySelector('.paragraph-dhours');
    return existingDataElement ? parseJson(existingDataElement.textContent.trim()) : {};
    }
    
    function parseJson(jsonString) {
    try { return JSON.parse(jsonString); }
    catch (error) { console.error("Error parsing JSON:", error); return null; }
    }
    
    function updateCheckboxOptions(selectedDates, containerId) {
        const openingHourStr = $('#ouverture-lieu').text();
        const openingHour = parseInt(openingHourStr.split(/[:h]/)[0]);
        const closingHourStr = $('#fermeture-lieu').text();
        const closingHour = parseInt(closingHourStr.split(/[:h]/)[0]);
    const disabledHoursElement = document.querySelector('.paragraph-dhours');
    const disabledHoursText = disabledHoursElement.textContent.trim();
    const disabledHours = parseJson(disabledHoursText) || {};
    const checkboxContainer = $(`.checkbox-container[data-id="${containerId}"]`);
    checkboxContainer.empty();
    const upperLimitHour = (containerId === 'container2') ? closingHour : 24;
    for (let hour = 0; hour < upperLimitHour; hour++) {
    const isWithinRange = (closingHour > openingHour) ? (hour >= openingHour && hour < closingHour) : (hour >= openingHour || hour < closingHour);
    if (isWithinRange) {
    const isDisabled = selectedDates.some(selectedDate => {
    const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
    return (disabledHours[formattedSelectedDate] || [])
    .some(disabledHour => {
    const [start, end] = disabledHour.split(' à ');
    const [startHour] = start.split('h');
    const [endHour] = end.split('h');
    const selectedHour = parseInt(hour);
    return (startHour === '23' && endHour === '0' && (selectedHour === 23 || selectedHour === 0)) || (startHour !== '23' && selectedHour >= parseInt(startHour) && selectedHour < parseInt(endHour));
    });
    });
    const formattedHour = `${hour.toString().padStart(2, '0')}h00 à ${((hour + 1) % 24).toString().padStart(2, '0')}h00`;
    const checkboxDiv = $("<div>", { class: "checkbox-item" });
    const label = $("<label>", { text: formattedHour, for: `checkbox-${containerId}-${hour}`, style: isDisabled ? "color: #777; text-decoration: line-through; cursor: not-allowed;" : "" });
    const checkbox = $("<input>", { type: "checkbox", value: `${hour}:00`, id: `checkbox-${containerId}-${hour}`, class: "checkbox-hour", disabled: isDisabled, name: `checkbox-${containerId}` });
    checkboxDiv.append(label);
    checkboxDiv.append(checkbox);
    checkboxContainer.append(checkboxDiv);
    }
    }
    }
    
    function updateMoreDaysButton(selectedDates) {
    const moreDaysButton = $(".moredays");
    moreDaysButton.prop('disabled', selectedDates.length > 0 && (selectedDates[0].getDate() === tomorrow.getDate() || selectedDates.length > 1));
    }
    
    
    });
    
    function formatDate(date) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  
