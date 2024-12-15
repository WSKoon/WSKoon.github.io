import Papa from 'papaparse';
import Plotly from 'plotly.js-dist-min';

// Function to filter necessary columns from CSV data
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
            Attempts: row['Attempts'] || null, // Extract Attempts (e.g., "9/9")
        };
    }).filter((row) => row.Date instanceof Date && !isNaN(row.Date.getTime())); // Keep only valid rows
}

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

    // Traces for Squat, Bench, Deadlift
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
        hovertext: data.map((row) => getAttemptText(row, 'Bench')), // Hover text for Bench attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    const deadliftTrace = {
        x: dates,
        y: data.map((row) => row.Deadlift),
        name: 'Deadlift',
        mode: 'lines+markers',
        type: 'scatter',
        line: { color: 'green' },
        hovertext: data.map((row) => getAttemptText(row, 'Deadlift')), // Hover text for Deadlift attempts
        hoverinfo: 'text+x+y', // Show hovertext along with x and y values
    };

    // Total trace with hover text for Bodyweight and GL
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

    // Combine traces
    const traces = [squatTrace, benchTrace, deadliftTrace, totalTrace];

    // Layout without secondary y-axis
    const layout = {
        title: 'Lifts Over Time with Attempt Information',
        xaxis: { title: 'Date' },
        yaxis: { title: 'Lifts (Kg)' },
        hovermode: 'closest', // Highlight the closest data point
        width:600,
        height:750,
    };

    // Render the plot
    Plotly.newPlot('plot-lifts', traces, layout);
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

            // Initial plot with both GL and Bodyweight shown
            const glCheckbox = <HTMLInputElement>document.getElementById('toggleGL');
            const bodyweightCheckbox = <HTMLInputElement>document.getElementById('toggleBodyweight');

            createLiftsOverTimePlot(filteredData, glCheckbox.checked, bodyweightCheckbox.checked);

            // Add event listeners for checkboxes
            glCheckbox.addEventListener('change', () => {
                createLiftsOverTimePlot(filteredData, glCheckbox.checked, bodyweightCheckbox.checked);
            });

            bodyweightCheckbox.addEventListener('change', () => {
                createLiftsOverTimePlot(filteredData, glCheckbox.checked, bodyweightCheckbox.checked);
            });
        },
    });
});
