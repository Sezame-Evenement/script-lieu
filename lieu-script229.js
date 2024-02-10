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
    console.log("------------------");
    console.log("Parameters:");
    console.log(`- hour: ${hour}`);
    console.log(`- date: ${date}`);
    console.log("- data: ", data);
    console.log(`- selectedDate: ${selectedDate}`);
    console.log("- currentlySelectedHours:", Array.from(currentlySelectedHours));
    console.log("- previouslySelectedHours:", Array.from(previouslySelectedHours));
    console.log("------------------");

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


  
  function manageAdjacentHours(selectedHours, date, data, selectedDate, currentlySelectedHours, previouslySelectedHours, isDeselection = false) {
    // This function will add or remove adjacent hours based on the entire selection.
    // The logic for calculating which adjacent hours to add or remove should consider the
    // start and end of the selectedHours array and handle edge cases like day transitions.
  
    if (selectedHours.length > 0) {
      const firstHour = selectedHours[0];
      const lastHour = selectedHours[selectedHours.length - 1];
      const [firstHourBefore] = getAdjacentHours(firstHour);
      const [, lastHourAfter] = getAdjacentHours(lastHour);
  
      // When selecting, add adjacent hours if they're not already included
      if (!isDeselection) {
        if (!currentlySelectedHours.has(firstHourBefore)) {
          addTimeRange(firstHourBefore, date, data, selectedDate);
        }
        if (!currentlySelectedHours.has(lastHourAfter)) {
          addTimeRange(lastHourAfter, date, data, selectedDate);
        }
      } else {
        // When deselecting, remove adjacent hours if they were not part of the original selection
        if (!previouslySelectedHours.has(firstHourBefore) && currentlySelectedHours.has(firstHourBefore)) {
          removeTimeRange(firstHourBefore, date, data, selectedDate);
        }
        if (!previouslySelectedHours.has(lastHourAfter) && currentlySelectedHours.has(lastHourAfter)) {
          removeTimeRange(lastHourAfter, date, data, selectedDate);
        }
      }
    }
  }
  
  // Ensure addTimeRange and removeTimeRange are properly implemented to handle adding and removing time ranges.
  
  function formatHour(hour) {
    // Convert hour to integer in case it's a string
    const hourInt = parseInt(hour, 10);
    // Return formatted hour without leading zero if less than 10, else return as is
    return hourInt < 10 ? `${hourInt}` : `${hourInt}`;
}

function addTimeRange(hour, date, data, selectedDate) {
  if (!data[selectedDate]) {
    data[selectedDate] = [];
  }

  // Handle edge case for hour 23
  const nextHour = hour === 23 ? 0 : (hour + 1) % 24;

  // Construct the time range string without leading zeros
  const formattedHour = hour.toString().replace(/^0+/, '');
  const formattedNextHour = nextHour.toString().replace(/^0+/, '');
  const timeRange = `${formattedHour}h à ${formattedNextHour}h`;

  // Update data based on checkbox state
  const isAdding = document.getElementById(`checkbox-${hour}-${selectedDate}`).checked; // Assuming you have checkboxes with such IDs
  if (isAdding) {
    data[selectedDate].push(timeRange);
  } else {
    const index = data[selectedDate].indexOf(timeRange);
    if (index !== -1) {
      data[selectedDate].splice(index, 1);
    }
  }
}





    
    function handleEdgeCases(hour, date, data, selectedDate, isPrevDay, isNextDay) {
      if (isPrevDay && hour === 0) {
        addTimeRangeIfNecessary(23, data, selectedDate, true);
      } else if (isNextDay && hour === 23) {
        addTimeRangeIfNecessary(0, data, selectedDate, false);
      }
    
      if (isPrevDay || isNextDay) {
        for (let i = hour + 1; i < 24; i++) {
          addTimeRangeIfNecessary(i, data, selectedDate, isPrevDay);
        }
      }
    }
    
    function addTimeRangeIfNecessary(hour, data, selectedDate, isPrevDay) {
      const formattedDate = selectedDate.toLocaleDateString('fr-CA');
      if (!data[formattedDate].includes(`${hour}h à ${(hour + 1) % 24}h`)) {
        addTimeRange(hour, selectedDate, data, isPrevDay);
      }
    }

  function removeTimeRange(hour, date, data, selectedDate, isPrevDay = false, isNextDay = false) {
              console.log(`Removing time range for hour ${hour} on date ${date}`);

  
  let targetDate = new Date(selectedDate);
  targetDate = adjustDateForHour(hour, targetDate);
  removeRangeFromData(hour, targetDate, data);
  
  if (hour === 0) {
  let prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  removeRangeFromData(23, prevDate, data);
  } else if (hour === 23) {
  let nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  removeRangeFromData(0, nextDate, data);
  }
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