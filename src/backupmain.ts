import Papa from 'papaparse';
import Plotly from 'plotly.js-dist-min';

document.getElementById('uploadForm')!.addEventListener('submit', (event) => {
    event.preventDefault();
    const fileInput = <HTMLInputElement>document.getElementById('fileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a file.');
        return;
    }

    const file = fileInput.files[0];
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
            const data = result.data as Array<{ [key: string]: string | number }>;
            displaySummary(data);
            createPlot(data);
        },
    });
});

function displaySummary(data: Array<{ [key: string]: string | number }>) {
    const summaryTable = document.getElementById('summaryTable')!;
    const keys = Object.keys(data[0]);

    const stats = keys.map((key) => {
        const values = data.map((row) => parseFloat(row[key] as string)).filter((val) => !isNaN(val));
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return `<tr><td>${key}</td><td>${values.length}</td><td>${mean.toFixed(2)}</td></tr>`;
    });

    summaryTable.innerHTML = `
        <table border="1">
            <thead>
                <tr><th>Column</th><th>Count</th><th>Mean</th></tr>
            </thead>
            <tbody>
                ${stats.join('')}
            </tbody>
        </table>
    `;
}

function createPlot(data: Array<{ [key: string]: string | number }>) {
    const keys = Object.keys(data[0]);

    const trace = {
        x: data.map((row) => row[keys[0]]),
        y: data.map((row) => row[keys[1]]),
        mode: 'markers',
        type: 'scatter',
    };

    const layout = {
        title: 'Scatter Plot',
        xaxis: { title: keys[0] },
        yaxis: { title: keys[1] },
    };

    Plotly.newPlot('plot', [trace], layout);
}
