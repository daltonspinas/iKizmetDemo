import { Component, OnInit } from '@angular/core';
import { DataService, IChartData, IStats, ITimeRange } from 'src/app/services/data.service';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {

    chartData: IChartData;

    data: any[];
    displayData: any[];

    columns: string[];

    currency: string;

    stats: IStats;

    intervalToGroupBy: string = 'Day'

    timeRanges: ITimeRange[] = [
        { display: 'Last 30 Days', start: moment().subtract(30, 'days').toISOString(), end: moment().toISOString() },
        { display: 'YTD', start: moment().startOf('year').toString(), end: moment().toString() },
        // TODO dynamically get the current date and determine how many of the current year's quarters to display
        { display: `Q2 ${moment().year().toString()}`, start: this.getStartOfMonth(3), end: this.getEndOfMonth(5) },
        { display: `Q1 ${moment().year().toString()}`, start: this.getStartOfMonth(0), end: this.getEndOfMonth(2) },
        { display: `Q4 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(9, true), end: this.getEndOfMonth(11, true) },
        { display: `Q3 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(6, true), end: this.getEndOfMonth(8, true) },
        { display: `Q2 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(3, true), end: this.getEndOfMonth(5, true) },
        { display: `Q1 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(0, true), end: this.getEndOfMonth(2, true) }]




    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.dataService.getData().subscribe((response: any) => {
            // this.chartData = this.dataService.parse(response);
            this.chartData = response;
            this.currency = this.chartData.currencySymbol;
            this.data = this.dataService.parse(this.chartData.data, this.currency);
            this.columns = ['', ...this.chartData.legend]

            // Here is where we want to preserve the data from the backend, and only manipulate the displayData
            this.displayData = this.dataService.filterByDate(this.data, moment().subtract(30, 'days').toISOString(), moment().toISOString());
            this.stats = this.dataService.calculateStats(this.displayData);
        })
    }

    // Is this deprecated?
    clearData() {
        this.data = this.dataService.parse(this.chartData.data, this.currency);
    }

    getStartOfMonth(month: number, previousYear?: boolean): string {
        // months will be 0 based indexes from 0-11 so January = 0, December = 11
        if (previousYear) {
            return moment().subtract(1, 'year').month(month).startOf('month').toISOString()
        }
        else {
            return moment().month(month).startOf('month').toISOString()
        }
    }

    getEndOfMonth(month: number, previousYear?: boolean): string {
        if (previousYear) {
            return moment().subtract(1, 'year').month(month).endOf('month').toISOString()
        }
        else {
            return moment().month(month).endOf('month').toISOString()
        }
    }

    dateRangeSelected(idx) {
        let timeRange = this.timeRanges[idx];
        console.log('time range', timeRange)
        this.displayData = this.dataService.filterByDate(this.data, timeRange.start, timeRange.end);
        this.stats = this.stats = this.dataService.calculateStats(this.displayData);
    }

    groupBy(event: string) {
        this.intervalToGroupBy = event;
        this.displayData = this.dataService.groupBy(this.displayData, event);
    }

    exportAsSpreadsheet() {
        
        let element = document.getElementById('excel-table');

        // create the workbook and the sheet
        const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        XLSX.writeFile(workbook, 'Your Report');
    }

    // This is the select event from the googleChart
    onSelect(event) {

    }

}
