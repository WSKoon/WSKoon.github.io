import Papa from 'papaparse';
import Plotly from 'plotly.js-dist-min';

// Function to filter and process the CSV data
function filterColumns(data: Array<{ [key: string]: string | number }>) {
    return data.map((row) => {
        return {
            Date: new Date(row['Date']), // Parse Date column
            Squat: parseFloat(row['Best3SquatKg'] as string) || null,
            Bench: parseFloat(row['Best3BenchKg'] as string) || null,
            Deadlift: parseFloat(row['Best3DeadliftKg'] as string) || null,
            Total: parseFloat(row['TotalKg'] as string) || null,
            GL: parseFloat(row['Goodlift'] as string) || null,
            Bodyweight: parseFloat(row['BodyweightKg'] as string) || null,
            Squat1Kg: parseFloat(row['Squat1Kg'] as string) || null,
            Squat2Kg: parseFloat(row['Squat2Kg'] as string) || null,
            Squat3Kg: parseFloat(row['Squat3Kg'] as string) || null,
            Bench1Kg: parseFloat(row['Bench1Kg'] as string) || null,
            Bench2Kg: parseFloat(row['Bench2Kg'] as string) || null,
            Bench3Kg: parseFloat(row['Bench3Kg'] as string) || null,
            Deadlift1Kg: parseFloat(row['Deadlift1Kg'] as string) || null,
            Deadlift2Kg: parseFloat(row['Deadlift2Kg'] as string) || null,
            Deadlift3Kg: parseFloat(row['Deadlift3Kg'] as string) || null,
        };
    }).filter((row) => row.Date instanceof Date && !isNaN(row.Date.getTime())); // Keep only valid rows
}

// Function to create the main plot (Squat, Bench, Deadlift, and Total over time)
function createLiftsOverTimePlot(data: any[]) {
    const dates = data.map((row) => row.Date);

    // Function to generate attempt hover text
    function getAttemptText(row: any, lift: string) {
        // Attempt columns for Squat, Bench, and Deadlift
        const attemptColumns = [
            `${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`
        ];

        return attemptColumns.map((col, index) => {
            const attempt = row[col] ? `${row[col]} kg` : 'Failed'; // Show weight or "Failed"
            return `${lift} Attempt ${index + 1}: ${attempt}`;
        }).join('<br>'); // Join attempts with line breaks for readability
    }

    // Main traces for Squat, Bench, Deadlift, and Total
    const squatTrace = {
        x: dates,
        y: data.map((row) => row.Squat),
        name: 'Squat',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'blue' },
        hovertext: data.map((row) => getAttemptText(row, 'Squat')), // Hover text for Squat attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const benchTrace = {
        x: dates,
        y: data.map((row) => row.Bench),
        name: 'Bench',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'red' },
        hovertext: data.map((row) => getAttemptText(row, 'Bench')), // Hover text for Squat attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const deadliftTrace = {
        x: dates,
        y: data.map((row) => row.Deadlift),
        name: 'Deadlift',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'green' },
        hovertext: data.map((row) => getAttemptText(row, 'Deadlift')), // Hover text for Squat attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const totalTrace = {
        x: dates,
        y: data.map((row) => row.Total),
        name: 'Total',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'black', dash: 'dash' },
        hovertext: data.map(
            (row) => `Bodyweight: ${row.Bodyweight} kg<br>GL: ${row.GL}`
        ),
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    // Combine the main traces
    const traces = [squatTrace, benchTrace, deadliftTrace, totalTrace];

    // Layout for the main plot
    const layout = {
        title: 'Lifts Over Time with Attempt Information',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Lifts (Kg)' },
        hovermode: 'closest', // Highlight the closest data point

    };

    // Render the main plot
    Plotly.newPlot('plot-lifts', traces, layout);

    // Create individual graphs for Squat, Bench, and Deadlift attempts
    createAttemptsGraph(data, 'Squat', 'plot-squat');
    createAttemptsGraph(data, 'Bench', 'plot-bench');
    createAttemptsGraph(data, 'Deadlift', 'plot-deadlift');
}

// Function to create individual attempts graph for each lift (Squat, Bench, Deadlift)
function createAttemptsGraph(data: any[], lift: string, containerId: string) {
    const dates = data.map((row) => row.Date);

    // Define color mapping for each lift (consistent with the main graph)
    const liftColors: { [key: string]: string } = {
        'Squat': 'blue',
        'Bench': 'red',
        'Deadlift': 'green'
    };

    // Attempt columns for Squat, Bench, and Deadlift
    const attemptColumns = [`${lift}1Kg`, `${lift}2Kg`, `${lift}3Kg`];

    // Creating traces for each date
    const traces = data.map((row) => {
        // Plot data as [Attempt 1, Attempt 2, Attempt 3] (x-axis) vs weight (y-axis)
        const attempts = attemptColumns.map((col, index) => {
            // If the attempt is valid (not negative), use the weight; otherwise, plot as -1 (for failed attempts)
            return (row[col] && !isNaN(row[col]) && row[col] > 0) ? row[col] : null;  // Exclude negative/failed attempts
        }).filter(weight => weight !== null);  // Remove null values for plotting

        // Corresponding x values (Attempts 1, 2, 3), but only for successful attempts
        const xValues = attempts.length > 0 ? [1, 2, 3].slice(0, attempts.length) : [];  // Adjust x-axis according to valid attempts

        // Format the date as 'YYYY-MM-DD' for the legend
        const formattedDate = row.Date.toISOString().split('T')[0];  // Format the date to 'YYYY-MM-DD'

        // Hover text indicating "Failed" if the attempt is invalid
        const hovertext = attemptColumns.map((col, index) => {
            const attempt = (row[col] && !isNaN(row[col]) && row[col] > 0) ? `${row[col]} kg` : 'Failed';
            return `${lift} Attempt ${index + 1}: ${attempt}`;
        });

        return {
            x: xValues, // Only include valid attempts (Attempt 1, 2, or 3)
            y: attempts, // Only plot valid attempts
            name: formattedDate, // Simplified legend name (date in 'YYYY-MM-DD' format)
            mode: 'lines+markers',
            type: 'scatter',
            line: { color: liftColors[lift] }, // Use the color assigned to each lift
            hovertext: hovertext, // Show hover-over text with details
            hoverinfo: 'text+x+y',
        };
    });

    // Layout configuration for the graph
    const layout = {
        title: `${lift} Attempts Over Time`,
        xaxis: { title: 'Attempt Number', tickvals: [1, 2, 3], ticktext: ['Attempt 1', 'Attempt 2', 'Attempt 3'] },
        yaxis: { title: `${lift} Weight (Kg)` },
        hovermode: 'closest', // Hover interaction

    };

    Plotly.newPlot(containerId, traces, layout);
}


// Event listener for file upload
document.getElementById('uploadForm')!.addEventListener('submit', (event) => {
    event.preventDefault();

    const fileInput = <HTMLInputElement>document.getElementById('fileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file.');
        return;
    }

    Papa.parse(fileInput.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
            const rawData = result.data as any[];
            const filteredData = filterColumns(rawData);

            createLiftsOverTimePlot(filteredData);
        },
    });
});