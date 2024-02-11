
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
  
  const previouslySelectedHours = new Set();
  if (dataToUpdate[formattedSelectedDate]) {
  dataToUpdate[formattedSelectedDate].forEach(range => {
  const startHour = parseInt(range.split('h')[0]);
  previouslySelectedHours.add(startHour);
  });
  }
  
  const currentlySelectedHours = new Set();
  checkboxContainer.find('.checkbox-hour:checked').each(function() {
  const hour = parseInt(this.value.split(':')[0]);
  currentlySelectedHours.add(hour);
  });
  
  for (let hour = 0; hour < 24; hour++) {
  handleTimeSlot(hour, formattedSelectedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours);
  }
  
  mergeDataAndUpdateInput();
  }
  
  
  function handleTimeSlot(hour, formattedDate, dataToUpdate, selectedDate, currentlySelectedHours, previouslySelectedHours) {
    // Determine if the hour is being selected or deselected.
    const isSelected = currentlySelectedHours.has(hour);
    const wasSelected = previouslySelectedHours.has(hour);

    if (isSelected && !wasSelected) {
        console.log(`[Add] New selection: ${hour}h on date: ${formattedDate}`);
        addTimeRange(hour, formattedDate, dataToUpdate, selectedDate);
    } else if (!isSelected && wasSelected) {
        console.log(`[Remove] Deselection: ${hour}h on date: ${formattedDate}`);
        removeTimeRange(hour, formattedDate, dataToUpdate, selectedDate);
    }

    // After handling the current operation, update adjacent hours.
    updateAdjacentHours(currentlySelectedHours, formattedDate, dataToUpdate, selectedDate);
}


function updateAdjacentHours(currentlySelectedHours, formattedDate, dataToUpdate, selectedDate) {
  if (currentlySelectedHours.size > 0) {
      let minHour = Math.min(...currentlySelectedHours);
      let maxHour = Math.max(...currentlySelectedHours);

      // Add adjacent hours if not already present
      if (!currentlySelectedHours.has(minHour - 1)) {
          console.log(`Adding adjacent hour before: ${minHour - 1}`);
          addTimeRange(minHour - 1, formattedDate, dataToUpdate, selectedDate);
      }
      if (!currentlySelectedHours.has(maxHour + 1)) {
          console.log(`Adding adjacent hour after: ${maxHour + 1}`);
          addTimeRange(maxHour + 1, formattedDate, dataToUpdate, selectedDate);
      }
  }
}




  
  
  
  
  
  
  function addTimeRange(hour, date, data, selectedDate, isPrevDay = false, isNextDay = false) {
      // Log initial input state before any modifications
      console.log("addTimeRange: Initial data state:", data);
    
      // Handle edge cases to prevent unexpected behavior
      if (hour < 0) {
        console.warn("addTimeRange: Hour out of bounds (less than 0). Shifting to previous day and adjusting hour to 23.");
        hour = 23;
        isPrevDay = true;
      } else if (hour > 23) {
        console.warn("addTimeRange: Hour out of bounds (greater than 23). Shifting to next day and adjusting hour to 0.");
        hour = 0;
        isNextDay = true;
      }
    
      // Adjust date based on isPrevDay/isNextDay flags
      const targetDate = new Date(selectedDate);
      if (isPrevDay) {
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (isNextDay) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    
      // Format date for consistency and readability
      const targetFormattedDate = targetDate.toLocaleDateString('fr-CA');
    
      // Calculate end hour for range
      const endHour = (hour + 1) % 24;
      const range = `${hour}h à ${endHour}h`;
    
      // Access or create the array for the target date
      data[targetFormattedDate] = data[targetFormattedDate] || [];
    
      // Check if range already exists and log potential additions
      if (!data[targetFormattedDate].includes(range)) {
        console.log("addTimeRange: Adding range", range, "to date", targetFormattedDate);
        data[targetFormattedDate].push(range);
      } else {
        console.log("addTimeRange: Range", range, "already exists for date", targetFormattedDate);
      }
    
      // Log final data state after modifications
      console.log("addTimeRange: Final data state:", data);
    }
    
    function removeTimeRange(hour, date, data, selectedDate, isPrevDay = false, isNextDay = false) {
      // Log initial input state before any modifications
      console.log("removeTimeRange: Initial data state:", data);
    
      // Adjust date based on isPrevDay/isNextDay flags
      let targetDate = new Date(selectedDate);
      targetDate = adjustDateForHour(hour, targetDate);
    
      // Attempt to remove range for the target date and log outcome
      const removed = removeRangeFromData(hour, targetDate, data);
      if (removed) {
        console.log("removeTimeRange: Removed range", removed, "from date", targetDate.toLocaleDateString('fr-CA'));
      } else {
        console.log("removeTimeRange: Range not found for removal from date", targetDate.toLocaleDateString('fr-CA'));
      }
    
      // Handle edge cases if removing 0 or 23 hours and log actions
      if (hour === 0) {
        let prevDate = new Date(selectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const removedPrev = removeRangeFromData(23, prevDate, data);
        if (removedPrev) {
          console.log("removeTimeRange: Removed range 23h from previous day", prevDate.toLocaleDateString('fr-CA'));
        }
      } else if (hour === 23) {
        let nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const removedNext = removeRangeFromData(0, nextDate, data);
        if (removedNext) {
          console.log("removeTimeRange: Removed range 0h from next day", nextDate.toLocaleDateString('fr-CA'));
        }
      }
    
      // Log final data state after modifications
      console.log("removeTimeRange: Final data state:", data);
    }
    
   
  function adjustDateForHour(hour, date) {
  if (hour < 0) {
  hour = 23;
  date.setDate(date.getDate() - 1);
  } else if (hour > 23) {
  hour = 0;
  date.setDate(date.getDate() + 1);
  }
  return date;
  }
  
  function removeRangeFromData(hour, date, data) {
  const targetFormattedDate = date.toLocaleDateString('fr-CA');
  const endHour = (hour + 1) % 24;
  const range = `${hour}h à ${endHour}h`;
  
  
  if (data[targetFormattedDate]) {
  const index = data[targetFormattedDate].indexOf(range);
  if (index !== -1) {
  data[targetFormattedDate].splice(index, 1);
  }
  }
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

  function mergeDataAndUpdateInputForDateFullDisabled() {
    let mergedData = {};
  
    // Only merge data from container1Data and container2Data, deliberately excluding existing data
    let allDates = new Set([...Object.keys(container1Data), ...Object.keys(container2Data)]);
  
    allDates.forEach(date => {
      let dataFromContainer1 = container1Data[date] || [];
      let dataFromContainer2 = container2Data[date] || [];
      
      // No existing data considered here
      mergedData[date] = [...new Set([...dataFromContainer1, ...dataFromContainer2])];
    });
  
    // Remove dates with no data
    for (let date in mergedData) {
      if (mergedData[date].length === 0) {
        delete mergedData[date];
      }
    }
  
    // Assuming #datefulldisabled is an input where you want to store the JSON string
    $('#datefulldisabled').val(JSON.stringify(mergedData));
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
  
  function formatDate(date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  });
  
