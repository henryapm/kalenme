'use client'

// components/CoachAvailabilitySettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
// ... (date-fns imports remain the same)
import { format, addWeeks, subWeeks, parse, addMinutes, startOfWeek, endOfWeek, addDays, isAfter, isBefore, isToday, startOfDay, parseISO, getDay } from 'date-fns';

// UPDATED ORDER: Sun -> Sat matches date-fns getDay() and new orderedDays
const daysOfWeekMap = [
    { id: 0, name: 'Sunday' },
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
];
// UPDATED ORDER: Sun -> Sat
const orderedDays = [0, 1, 2, 3, 4, 5, 6];

// ... (generateTimeOptions, durationOptions, initialSettings remain the same) ...
const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
     options.push('24:00');
    return options;
};
const timeOptions = generateTimeOptions();
const durationOptions = [15, 30, 60, 120];
const initialSettings = {
    duration: 60,
    buffer: 15,
    endDate: null, // e.g., '2025-12-31' or null
    rules: [
        { id: 'rule1', day: 1, start: '09:00', end: '12:00' },
        { id: 'rule2', day: 1, start: '13:00', end: '17:00' },
        { id: 'rule3', day: 2, start: '10:00', end: '16:00' },
        { id: 'rule3', day: 3, start: '10:00', end: '16:00' },
        { id: 'rule3', day: 4, start: '10:00', end: '16:00' },
        { id: 'rule3', day: 5, start: '10:00', end: '16:00' },
    ],
};

const today = startOfDay(new Date());

export default function CoachAvailabilitySettings() {
    // ... (useState hooks remain the same) ...
    const [duration, setDuration] = useState(initialSettings.duration);
    const [buffer, setBuffer] = useState(initialSettings.buffer);
    const [availabilityEndDate, setAvailabilityEndDate] = useState(initialSettings.endDate);
    const [rules, setRules] = useState(() => initialSettings.rules.map(r => ({ ...r, id: crypto.randomUUID() })));
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));


    const getWeekDates = (start) => {
        // ... (same as before - returns Sun to Sat)
         const weekDates = [];
        for (let i = 0; i < 7; i++) {
            weekDates.push(addDays(start, i));
        }
        return weekDates;
    };

    // Define default values for new slots
    const DEFAULT_NEW_SLOT_START = '09:00';
    const DEFAULT_NEW_SLOT_DURATION_MINUTES = 60;
    const DEFAULT_GAP_MINUTES = 0; // Gap between last slot and new one

    const handleAddTimeSlot = (dayId) => {
        // Find the last rule for the specific day (simplified callback)
        const lastRule = rules.findLast(rule => rule.day === dayId);

        let newStartStr = DEFAULT_NEW_SLOT_START;
        let newEndStr = ''; // Will be calculated

        if (lastRule) {
            // If a last rule exists, calculate based on its end time
            try {
                // Use a dummy date for time parsing/calculation
                const baseDate = new Date('1970-01-01T00:00:00');
                const lastEndTime = parse(lastRule.end, 'HH:mm', baseDate);

                if (isNaN(lastEndTime)) {
                    // Handle potential parsing error if lastRule.end is invalid format
                    console.error("Could not parse last end time:", lastRule.end);
                    // Fallback to default? Or show error? For now, use default logic below.
                } else {
                    // Calculate new start time: last end time + gap
                    const newStartTime = addMinutes(lastEndTime, DEFAULT_GAP_MINUTES);

                    // Prevent new start time from going past midnight (e.g., cap at 23:59 or handle differently)
                    // For simplicity, let's prevent adding if the new start would be >= 24:00
                    if (newStartTime.getDate() > baseDate.getDate() || format(newStartTime, 'HH:mm') === '00:00') {
                        console.warn("Cannot add slot starting after or at midnight based on previous slot.");
                        alert("Cannot add a new time slot starting at or after midnight.");
                        return; // Stop execution
                    }

                    newStartStr = format(newStartTime, 'HH:mm');

                    // Calculate new end time: new start time + duration
                    const newEndTime = addMinutes(newStartTime, DEFAULT_NEW_SLOT_DURATION_MINUTES);

                    // Prevent end time from going past midnight? Or allow e.g. 23:00-24:00?
                    // Let's cap end time at 24:00 for now
                    if (newEndTime.getDate() > baseDate.getDate() || format(newEndTime, 'HH:mm') === '00:00' && !(newStartTime.getHours() === 23 && newStartTime.getMinutes() === (60 - DEFAULT_NEW_SLOT_DURATION_MINUTES)) ) { // Allow ending exactly at 24:00 only if duration allows
                        newEndStr = '24:00'; // Cap at midnight
                    } else {
                        newEndStr = format(newEndTime, 'HH:mm');
                    }

                    // Basic validation: Ensure end time is after start time
                    if (newEndStr <= newStartStr && newEndStr !== '24:00') {
                        console.error("Calculated invalid end time.");
                        // Fallback or error - set default duration from new start
                        const defaultEndTime = addMinutes(newStartTime, DEFAULT_NEW_SLOT_DURATION_MINUTES);
                        newEndStr = format(defaultEndTime, 'HH:mm'); // Recalculate default end
                        if (newEndStr <= newStartStr) newEndStr = '24:00'; // Last resort cap
                    }
                }

            } catch (error) {
                console.error("Error calculating new time slot:", error);
                // Fallback to default if any error occurs
                newStartStr = DEFAULT_NEW_SLOT_START;
                newEndStr = ''; // Reset end string to trigger default calculation below
            }
        }

        // If end string wasn't calculated above (no last rule, or error), calculate default end
        if (!newEndStr) {
            try {
                const baseDate = new Date('1970-01-01T00:00:00');
                const startTime = parse(newStartStr, 'HH:mm', baseDate);
                const endTime = addMinutes(startTime, DEFAULT_NEW_SLOT_DURATION_MINUTES);
                newEndStr = format(endTime, 'HH:mm');
                // Cap default end time too
                if (endTime.getDate() > baseDate.getDate() || newEndStr === '00:00') {
                    newEndStr = '24:00';
                }
            } catch(e) {
                console.error("Error calculating default end time", e);
                newEndStr = format(addMinutes(parse(DEFAULT_NEW_SLOT_START, 'HH:mm', new Date()), DEFAULT_NEW_SLOT_DURATION_MINUTES), 'HH:mm'); // Safer default
            }

        }


        // Add the new rule to the state
        setRules([
            ...rules,
            { id: crypto.randomUUID(), day: dayId, start: newStartStr, end: newEndStr },
        ]);
    };
    
     const handleRemoveTimeSlot = (ruleId) => {
         setRules(rules.filter(rule => rule.id !== ruleId));
    };
     const handleRuleChange = (ruleId, field, value) => {
         setRules(rules.map(rule =>
            rule.id === ruleId ? { ...rule, [field]: value } : rule
        ));
    };
     const handlePrevWeek = () => {
        setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    };
     const handleNextWeek = () => {
        setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    };
     const handleSave = () => {
         console.log("Saving data:", { /* ... */ });
         alert("Settings saved (check console)!");
    };


    // ... (getVizData remains the same logic, relies on getDay()) ...
    const getVizData = useCallback(() => {
        const viz = {};
        const weekDates = getWeekDates(currentWeekStart);
        const parsedEndDate = availabilityEndDate ? startOfDay(parseISO(availabilityEndDate)) : null;
        
        
        weekDates.forEach(date => {
            const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
            const dateString = format(date, 'yyyy-MM-dd');

            if (parsedEndDate && isAfter(startOfDay(date), parsedEndDate)) {                
                return;
            }

            rules.filter(rule => rule.day === dayOfWeek).forEach(rule => {
                const startHour = parseInt(rule.start.split(':')[0]);
                const startMinute = parseInt(rule.start.split(':')[1]);
                const endHour = parseInt(rule.end.split(':')[0]);
                const endMinute = parseInt(rule.end.split(':')[1]);

                 for (let h = startHour; h <= endHour; h++) {
                     if (h === 24 && endMinute > 0) continue;
                     if (h === endHour && endMinute === 0 && startMinute === 0 && h === startHour) break;

                    const startM = (h === startHour) ? startMinute : 0;
                    const endM = (h === endHour) ? endMinute : 60;

                     for (let m = startM; m < endM; m += 30) {
                        const timeKey = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        viz[`${dateString}-${timeKey}`] = true;
                    }
                }
            });
        });
        
        return viz;
    }, [rules, currentWeekStart, availabilityEndDate]);


    const vizData = getVizData();
    const vizTimeLabels = timeOptions.filter((t, i) => i % 2 === 0 && t !== '24:00');
    // Use dates directly from getWeekDates (Sun -> Sat order)
    const currentWeekDateObjects = getWeekDates(currentWeekStart);

    return (
        // UPDATED CSS: w-full on container
        <div className="flex flex-col md:flex-row gap-8 p-4 w-full mx-auto">
            {/* Left Panel: Inputs - UPDATED CSS: md:w-1/4 */}
            <div className="w-full md:w-1/4 space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Configure Availability</h2>

                {/* Session Settings (Select added previously) */}
                {/* ... Duration Select ... */}
                 {/* ... Buffer Input ... */}
                 <div className="space-y-3">
                     <h3 className="font-medium">Session Settings</h3>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                            Default Session Duration
                        </label>
                        <select id="duration" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            {durationOptions.map(opt => ( <option key={opt} value={opt}>{opt} minutes</option> ))}
                        </select>
                    </div>
                    {/* TODO: Buffer Functionality */}
                    {/* <div>
                        <label htmlFor="buffer" className="block text-sm font-medium text-gray-700"> Buffer Between Sessions (minutes) </label>
                        <input type="number" id="buffer" value={buffer} min="0" onChange={(e) => setBuffer(parseInt(e.target.value) >= 0 ? parseInt(e.target.value) : 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div> */}
                 </div>

                <div className="space-y-3">
                     <h3 className="font-medium">Weekly Recurring Availability</h3>
                    {daysOfWeekMap
                        .filter(d => orderedDays.includes(d.id)) // Keep filter for safety
                        .map(day => ( // Renders Sun -> Sat based on daysOfWeekMap order
                        <div key={day.id} className="p-3 border rounded bg-gray-50">
                            <label className="font-semibold text-gray-800">{day.name}</label>
                             {/* ... code for rendering time slot inputs ... */}
                              <div className="mt-2 space-y-2">
                                {rules.filter(rule => rule.day === day.id).map(rule => (
                                     <div key={rule.id} className="flex items-center gap-2">
                                        <select value={rule.start} onChange={(e) => handleRuleChange(rule.id, 'start', e.target.value)} className="block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" >
                                            {timeOptions.map(t => <option key={t+rule.id+'start'} value={t}>{t}</option>)}
                                        </select>
                                        <span>-</span>
                                        <select value={rule.end} onChange={(e) => handleRuleChange(rule.id, 'end', e.target.value)} className="block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" >
                                            {timeOptions.map(t => <option key={t+rule.id+'end'} value={t}>{t}</option>)}
                                        </select>
                                        <button onClick={() => handleRemoveTimeSlot(rule.id)} className="text-red-500 hover:text-red-700 p-1">✕</button>
                                    </div>
                                ))}
                                 <button onClick={() => handleAddTimeSlot(day.id)} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1" > + Add Time Slot </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Availability End Date */}
                {/* ... (End Date Input JSX same as before) ... */}
                 <div className="space-y-3">
                    <h3 className="font-medium">Availability End Date (Optional)</h3>
                    <div>
                         <label htmlFor="endDate" className="block text-sm font-medium text-gray-700"> Stop applying this schedule after this date: </label>
                         <input type="date" id="endDate" value={availabilityEndDate || ''} onChange={(e) => setAvailabilityEndDate(e.target.value || null)} min={new Date().toISOString().split('T')[0]} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                         <p className="mt-1 text-xs text-gray-500">Leave blank if this schedule applies indefinitely.</p>
                    </div>
                 </div>

                {/* Save Button */}
                {/* ... (Save Button JSX same as before) ... */}
                  <div>
                     <button onClick={handleSave} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" > Save Availability Settings </button>
                 </div>

            </div>

            {/* Right Panel: Visualization - UPDATED CSS: md:w-3/4 */}
            <div className="w-full md:w-3/4 mt-8 md:mt-0 md:pl-8">
                 {/* Week Navigation (Unchanged) */}
                 <div className="flex justify-between items-center mb-4">
                    {/* ... Prev/Next buttons and Date Range display ... */}
                     <button onClick={handlePrevWeek} className="px-3 py-1 border rounded text-indigo-600 hover:bg-indigo-50">&lt; Prev</button>
                     <h2 className="text-lg font-semibold text-center"> {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart), 'MMM d, yyyy')} </h2>
                     <button onClick={handleNextWeek} className="px-3 py-1 border rounded text-indigo-600 hover:bg-indigo-50">Next &gt;</button>
                 </div>


                 <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-center sr-only">Availability Preview</h3>
                 <div className="overflow-x-auto">
                     {/* Grid uses actual dates now */}
                      <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-px bg-gray-200 border border-gray-200">
                         {/* Header Row (Actual Dates - Sun -> Sat) */}
                         <div className="bg-white"></div> {/* Top-left corner */}
                         {/* Use currentWeekDateObjects directly (Sun-Sat order) */}
                         
                         {currentWeekDateObjects.map(date => (
                            <div key={format(date, 'yyyy-MM-dd')} className={`text-center text-sm font-medium py-1  ${isToday(date) ? 'bg-green-300' : 'bg-gray-50'}`}>
                                {format(date, 'EEE d')} {/* Sun 7, Mon 8, etc. */}
                            </div>
                         ))}

                         {/* Time Rows */}
                         {vizTimeLabels.map(time => (
                            <React.Fragment key={time}>
                                <div className="text-xs text-right pr-1 bg-gray-50 pt-1">{time}</div>
                                 {/* Use currentWeekDateObjects directly */}
                                {currentWeekDateObjects.map(date => {
                                    const dateString = format(date, 'yyyy-MM-dd');
                                    const vizKeyHalfHour = `${dateString}-${time.replace(':00', ':30')}`;
                                    const vizKeyHour = `${dateString}-${time}`;
                                    const isAvailable = vizData[vizKeyHour] || vizData[vizKeyHalfHour];
                                    let isAvailableColor = '';
                                    if(!isAvailable) {
                                        isAvailableColor = 'bg-white'
                                    } else if (isAvailable && isBefore(date, today)) {
                                        isAvailableColor = 'bg-gray-300'
                                    } else {
                                        isAvailableColor = 'bg-green-200'
                                    }

                                    return (
                                        <div key={`${dateString}-${time}`} className={`h-8 ${isAvailableColor}`}></div>
                                    );
                                })}
                            </React.Fragment>
                         ))}
                     </div>
                 </div>
                 {/* ... (Clarity note below preview remains same) ... */}
                 <p className="mt-2 text-xs text-center text-gray-500"> Preview shows general availability based on saved rules. Actual bookable slots depend on duration, buffer, and calendar sync. </p>
            </div>

        </div>
    );
}