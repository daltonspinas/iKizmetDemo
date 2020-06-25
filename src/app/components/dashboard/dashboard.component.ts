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
    // let's keep a separate copy for the table so we don't group it by month, we want to have the full dataset available
    tableData: any[];

    columns: string[];

    currency: string;

    stats: IStats;

    intervalToGroupBy: string = 'Day'

    viewAsTable: boolean = false;

    timeRanges: ITimeRange[] = [
        { display: 'Last 30 Days', start: moment().subtract(30, 'days').toISOString(true), end: moment().toISOString(true) },
        { display: 'YTD', start: moment().startOf('year').toISOString(true), end: moment().toISOString(true) },
        // TODO: dynamically get the current date and determine how many of the current year's quarters to display
        { display: `Q2 ${moment().year().toString()}`, start: this.getStartOfMonth(3), end: this.getEndOfMonth(5) },
        { display: `Q1 ${moment().year().toString()}`, start: this.getStartOfMonth(0), end: this.getEndOfMonth(2) },
        { display: `Q4 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(9, true), end: this.getEndOfMonth(11, true) },
        { display: `Q3 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(6, true), end: this.getEndOfMonth(8, true) },
        { display: `Q2 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(3, true), end: this.getEndOfMonth(5, true) },
        { display: `Q1 ${moment().subtract(1, 'year').year().toString()}`, start: this.getStartOfMonth(0, true), end: this.getEndOfMonth(2, true) }
    ]


    // We'll default to last 30 days for the selected time range
    selectedTimeRange: ITimeRange = this.timeRanges[0];

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.dataService.getData().subscribe((response: any) => {
            // capture the raw API response in case we need to reference it again
            this.chartData = response;

            this.currency = this.chartData.currencySymbol;

            // capture a copy of the data in the format we will be using
            this.data = this.dataService.parse([...this.chartData.data], this.currency);

            this.columns = ['', ...this.chartData.legend]

            this.filterAndGroup();
        })
    }

    dateRangeSelected(idx) {
        this.selectedTimeRange = this.timeRanges[idx];
        this.filterAndGroup()
    }

    groupBy(event: string) {
        this.intervalToGroupBy = event;
        this.filterAndGroup()
    }

    filterAndGroup() {
        this.displayData = this.dataService.filterByDate([...this.data], this.selectedTimeRange.start, this.selectedTimeRange.end);
        // we want to capture the granular data for the table/spreadsheet before we group the display data by month
        this.tableData = this.displayData;
        this.stats = this.stats = this.dataService.calculateStats([...this.displayData]);
        // since grouping by day is as granular as we can get, let's avoid calling the method
        if (this.intervalToGroupBy != 'Day') {
            this.displayData = this.dataService.groupByMonth([...this.displayData]);
        }
    }

    viewHandler(){
        this.viewAsTable = !this.viewAsTable
    }

    exportAsSpreadsheet() {

        let element = document.getElementById('excel-table');

        // create the workbook and the sheet
        const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        XLSX.writeFile(workbook, `${this.selectedTimeRange.display}.xls`);
    }

    getStartOfMonth(month: number, previousYear?: boolean): string {
        // months will be 0 based indexes from 0-11 so January = 0, December = 11
        if (previousYear) {
            return moment().subtract(1, 'year').month(month).startOf('month').toISOString(true)
        }
        else {
            return moment().month(month).startOf('month').toISOString(true)
        }
    }

    getEndOfMonth(month: number, previousYear?: boolean): string {
        if (previousYear) {
            return moment().subtract(1, 'year').month(month).endOf('month').toISOString(true)
        }
        else {
            return moment().month(month).endOf('month').toISOString(true)
        }
    }

    // This is the select event from the googleChart
    onSelect(event) {

    }

}
