
document.addEventListener("DOMContentLoaded", function () {
    const openingHourStr = $('#ouverture-lieu').text();
    const openingHour = parseInt(openingHourStr.split(/[:h]/)[0]);
    const closingHourStr = $('#fermeture-lieu').text();
    const closingHour = parseInt(closingHourStr.split(/[:h]/)[0]);
    let container1Data = {};
    let container2Data = {};
    let initialSelectedDate, secondContainerVisible = false;
    const today = new Date(), tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = flatpickr("#date", {
        altInput: true, altFormat: "d/m/y", locale: "fr", enableTime: false, minDate: today,
        disable: [function (date) {
            return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        }],
        onChange: function (selectedDates) {
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

    const dateFullDisabledInput = document.querySelector('#datefulldisabled');

    document.addEventListener('change', function (event) {
        if ($(event.target).closest('.checkbox-container').length) {
            const selectedDates = dateInput.selectedDates;
            updateFirstDateInput(selectedDates, $(event.target).closest('.checkbox-container').data('id'));
            updateDateFullDisabled(selectedDates);
        }
    });

    function updateFirstDateInput(selectedDates, containerId) {
        let dataToUpdate = containerId === 'container1' ? container1Data : container2Data;
        const dateIndex = containerId === 'container1' ? 0 : 1;
        const selectedDate = selectedDates[dateIndex];
        if (!selectedDate) return;

        const formattedSelectedDate = selectedDate.toLocaleDateString('fr-CA');
        const previouslySelectedHours = new Set(dataToUpdate[formattedSelectedDate] ? dataToUpdate[formattedSelectedDate].map(range => parseInt(range.split('h')[0])) : []);
        const checkboxContainer = $(`.checkbox-container[data-id='${containerId}']`);
        const currentlySelectedHours = new Set(checkboxContainer.find('.checkbox-hour:checked').get().map(input => parseInt(input.value.split(':')[0])));

        updateHourSelection(dataToUpdate, formattedSelectedDate, true); 

        mergeDataAndUpdateInput();
    }

    function hourToRangeString(hour) {
        let startHour = hour % 24;
        let endHour = (hour + 1) % 24;
        return `${startHour}h à ${endHour}h`;
    }

    function updateHourSelection(data, dateStr, add = true) {
        let hours = data[dateStr] ? data[dateStr].map(range => parseInt(range.split('h')[0])) : [];
        hours.sort((a, b) => a - b);

        if (hours.length) {
            let firstHour = hours[0];
            let lastHour = hours[hours.length - 1];
            let prevHour = (firstHour - 1 + 24) % 24;
            let nextHour = (lastHour + 1) % 24;

            if (add) {
                if (!hours.includes(prevHour)) data[dateStr].push(hourToRangeString(prevHour));
                if (!hours.includes(nextHour)) data[dateStr].push(hourToRangeString(nextHour));
            } else {
                data[dateStr] = data[dateStr].filter(range => {
                    let hour = parseInt(range.split('h')[0]);
                    return hour !== prevHour && hour !== nextHour;
                });
            }
        }
    }

    function addTimeRange(hour, dateStr, data) {
        let formattedHour = hourToRangeString(hour);
        if (!data[dateStr]) data[dateStr] = [];
        if (!data[dateStr].includes(formattedHour)) {
            data[dateStr].push(formattedHour);
            updateHourSelection(data, dateStr);
        }
    }

    function removeTimeRange(hour, dateStr, data) {
        let targetRange = hourToRangeString(hour);
        if (data[dateStr] && data[dateStr].includes(targetRange)) {
            data[dateStr] = data[dateStr].filter(range => range !== targetRange);
            updateHourSelection(data, dateStr, false);
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

        if (hour === 0) {
            removeRangeFromData(23, adjustDateForHour(-1, new Date(date)), data);
        } else if (hour === 23) {
            removeRangeFromData(0, adjustDateForHour(24, new Date(date)), data);
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

    function formatDate(date) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
});
