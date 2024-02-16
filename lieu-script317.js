document.addEventListener("DOMContentLoaded", function() {
    let container1Data = {};
    let container2Data = {};
    let initialSelectedDate, secondContainerVisible = false;
    const today = new Date(), tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = flatpickr("#date", {
        altInput: true,
        altFormat: "d/m/y",
        locale: "fr",
        enableTime: false,
        minDate: today,
        disable: [function(date) {
          return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        }],
        onChange: function(selectedDates) {
          // Reset stored selections for containers
          container1Data = {};
          container2Data = {};
      
          // Clear checkbox selections
          $(".checkbox-hour:checked").prop('checked', false); // Uncheck all checkboxes
      
          if (selectedDates.length > 0) {
            initialSelectedDate = selectedDates[0];
            $(".date-heading").eq(0).text(formatDate(selectedDates[0]));
            updateCheckboxOptions(selectedDates, "container1");
            updateMoreDaysButton(selectedDates);
            // Update for the first date input and the full disabled input
            mergeDataAndUpdateInput('.firstdateinput'); // Include existing data
            mergeDataAndUpdateInput('#datefulldisabled'); // Exclude existing data
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
        }
      });
      
    
    
      
        const moreDaysButton = document.querySelector(".moredays");
        moreDaysButton.addEventListener("click", function() {
            const selectedDates = dateInput.selectedDates;
    
            // New logic to reset if second container is already visible
            if (secondContainerVisible) {
                // Reset stored selections for containers
                container1Data = {};
                container2Data = {};
    
                // Clear checkbox selections
                $(".checkbox-hour:checked").prop('checked', false); // Uncheck all checkboxes
    
                // Hide second container and update visibility flag
                $(".checkbox-container").eq(1).hide();
                $(".date-heading").eq(1).hide();
                secondContainerVisible = false;
    
                // Set the date picker to the initial selected date only
                if (initialSelectedDate) {
                    dateInput.setDate(initialSelectedDate);
                }
    
                // Reset the input fields as needed
                mergeDataAndUpdateInput('.firstdateinput');
                mergeDataAndUpdateInput('#datefulldisabled');
    
                return; // Exit the function early to avoid adding another day
            }
    
            // Existing logic for adding a second date
            if (selectedDates.length > 0 && !initialSelectedDate) {
                initialSelectedDate = selectedDates[0];
            }
    
            if (initialSelectedDate && selectedDates.length < 2) {
                const lastSelectedDate = selectedDates[selectedDates.length - 1];
                const nextDay = new Date(lastSelectedDate);
                nextDay.setDate(lastSelectedDate.getDate() + 1);
    
                dateInput.setDate([...selectedDates, nextDay]); // This will set the date to "DD/MM/YY, DD/MM/YY"
                const secondCheckboxContainer = $(".checkbox-container").eq(1);
                secondCheckboxContainer.html($(".checkbox-container").eq(0).html());
                updateCheckboxOptions([nextDay], "container2");
                secondCheckboxContainer.show();
                secondContainerVisible = true;
    
                $(".date-heading").eq(1).text(formatDate(nextDay));
                $(".date-heading").eq(1).show();
            }
    
            mergeDataAndUpdateInput('.firstdateinput');
            mergeDataAndUpdateInput('#datefulldisabled');
        });
    
   
    
    
    const firstDateInput = document.querySelector('.firstdateinput');
    document.addEventListener('change', function(event) {
    if ($(event.target).closest('.checkbox-container').length) {
    const containerId = $(event.target).closest('.checkbox-container').data('id');
    const selectedDates = dateInput.selectedDates;
    updateFirstDateInput(selectedDates, containerId);
    mergeDataAndUpdateInput('.firstdateinput');
    mergeDataAndUpdateInput('#datefulldisabled');
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

        // Special handling for wrapping around to the previous day for minimum hour
        if (minHour === 0) {
            addTimeRange(-2, formattedDate, dataToUpdate, selectedDate); // 22h à 23h on the previous day
            addTimeRange(-1, formattedDate, dataToUpdate, selectedDate); // 23h à 0h on the previous day
        } else {
            for (let i = 1; i <= 2; i++) {
                let hourToAdd = minHour - i;
                if (!currentlySelectedHours.has(hourToAdd)) {
                    addTimeRange(hourToAdd, formattedDate, dataToUpdate, selectedDate);
                }
            }
        }

        // Special handling for wrapping around to the next day for maximum hour
        if (maxHour === 23) {
            addTimeRange(24, formattedDate, dataToUpdate, selectedDate); // 0h à 1h on the next day
            addTimeRange(25, formattedDate, dataToUpdate, selectedDate); // 1h à 2h on the next day
        } else {
            for (let j = 1; j <= 2; j++) {
                let hourToAdd = maxHour + j;
                if (!currentlySelectedHours.has(hourToAdd)) {
                    addTimeRange(hourToAdd, formattedDate, dataToUpdate, selectedDate);
                }
            }
        }
    }
}



  
  
  
  
    
    
    
    
    
    
 
     
      function adjustDateForHour(hour, selectedDate) {
        let adjustedDate = new Date(selectedDate);
        if (hour < 0) {
            adjustedDate.setDate(adjustedDate.getDate() - 1); // Move to the previous day
            hour = 24 + hour; // Adjust hour to a valid 24-hour range
        } else if (hour > 23) {
            adjustedDate.setDate(adjustedDate.getDate() + 1); // Move to the next day
            hour = hour - 24;
        }
        return { adjustedHour: hour, adjustedDate };
    }


    function addTimeRange(hour, date, data, selectedDate) {
        console.log("addTimeRange: Initial data state:", data);
    
        // Adjust for negative hours or hours beyond 23, shifting date accordingly
        let { adjustedHour, adjustedDate } = adjustDateForHour(hour, selectedDate);
        const targetFormattedDate = adjustedDate.toLocaleDateString('fr-CA');
        const endHour = (adjustedHour + 1) % 24;
        const range = `${adjustedHour}h à ${endHour}h`;
    
        data[targetFormattedDate] = data[targetFormattedDate] || [];
        if (!data[targetFormattedDate].includes(range)) {
            console.log("addTimeRange: Adding range", range, "to date", targetFormattedDate);
            data[targetFormattedDate].push(range);
        } else {
            console.log("addTimeRange: Range", range, "already exists for date", targetFormattedDate);
        }
        console.log("addTimeRange: Final data state:", data);
    }
    
    function removeTimeRange(hour, date, data, selectedDate) {
      console.log("removeTimeRange: Initial data state:", data);
  
      // Basic removal for the current hour
      let { adjustedHour, adjustedDate } = adjustDateForHour(hour, selectedDate);
      removeRange(data, adjustedHour, adjustedDate);
  
      // Adjust for the next day if deselecting "23h à 0h"
      if (hour === 23) {
          let nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          // Attempt to remove "0h à 1h" for the next day
          removeRange(data, 0, nextDay);
          // Additionally remove "1h à 2h" for the next day, addressing the issue
          removeRange(data, 1, nextDay);
      }
  
      // Handle the scenario for deselecting "0h à 1h" as previously implemented
      if (hour === 0) {
          let prevDay = new Date(selectedDate);
          prevDay.setDate(prevDay.getDate() - 1);
          // Remove "22h à 23h"
          removeRange(data, 22, prevDay);
          // Remove "23h à 0h"
          removeRange(data, 23, prevDay);
      }
  
      console.log("removeTimeRange: Final data state:", data);
  }
  
    
    function removeRange(data, hour, date) {
        const targetFormattedDate = date.toLocaleDateString('fr-CA');
        const endHour = (hour + 1) % 24;
        const range = `${hour}h à ${endHour}h`;
    
        if (data[targetFormattedDate] && data[targetFormattedDate].includes(range)) {
            const index = data[targetFormattedDate].indexOf(range);
            data[targetFormattedDate].splice(index, 1);
            console.log(`removeRange: Removed ${range} from date ${targetFormattedDate}`);
            if (data[targetFormattedDate].length === 0) {
                delete data[targetFormattedDate]; // Clean up if no more ranges for the date
            }
        } else {
            console.log(`removeRange: ${range} not found for date ${targetFormattedDate}`);
        }
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
    
    
    function mergeDataAndUpdateInput(targetInputSelector) {
      let mergedData = {};
    
      const includeExistingData = targetInputSelector !== '#datefulldisabled';
      let existingData = includeExistingData ? getExistingData() : {}; // This is now always an object
    
      // Combining keys from all data sources
      let allDates = new Set([
        ...Object.keys(container1Data),
        ...Object.keys(container2Data),
        ...Object.keys(existingData),
      ]);
      
      allDates.forEach(date => {
        let dataFromContainer1 = container1Data[date] || [];
        let dataFromContainer2 = container2Data[date] || [];
        let existingDataForDate = existingData[date] || []; // This will be empty if includeExistingData is false
    
        mergedData[date] = [...new Set([...dataFromContainer1, ...dataFromContainer2, ...existingDataForDate])];
      });
    
      for (let date in mergedData) {
        if (mergedData[date].length === 0) {
          delete mergedData[date];
        }
      }
    
      // Use the targetInputSelector to dynamically target the input field for updating
      $(targetInputSelector).val(JSON.stringify(mergedData));
    }
    
  
   
    
    
    
    
    
    function getExistingData() {
    const existingDataElement = document.querySelector('.paragraph-dhours');
    return existingDataElement ? parseJson(existingDataElement.textContent.trim()) : {};
    }
    
    function parseJson(jsonString) {
      if (!jsonString) {
        console.warn("parseJson: Input is empty or undefined, returning empty object.");
        return {};
      }
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return {};
      }
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
