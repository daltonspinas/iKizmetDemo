import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';



export interface IChartData {
    chartSubTitle: string,
    chartTitle: string,
    currencySymbol: string,
    data: any[]
    legend: string[]
}

export enum IData {
    Date = 0,
    Services = 1,
    Products = 2,
    Recurring = 3,
    Expenses = 4
}

export interface ITimeRange {
    display: string,
    start: string,
    end: string,
}

export interface IStats {
    avgRev: number,
    mostProfitableDay: { val: number, date: string },
    mostExpensiveDay: { val: number, date: string },
    operatingExpenseRatio: number
}


@Injectable({
    providedIn: 'root'
})

export class DataService {

    constructor(private http: HttpClient, private datePipe: DatePipe) { }

    getData() {
        // using the cors-anywhere url as a proxy to bypass the cors check by the browser
        return this.http.get('https://cors-anywhere.herokuapp.com/https://dashboard-qa.ikizmet.com/api/v2/revenues/test');
    }

    parse(data, currency: string) {
        return data.map(el => {
            // let's make our expenses positive for the sake of displaying it to the user on a graph
            el[1][3] = Math.abs(el[1][3]);
            return [el[0], ...el[1]]
        })
    }

    // Is this deprecated?
    formatDate(date, format?: string) {
        // let formattedDate = this.datePipe.transform(date, 'MMMd');
        let formattedDate = this.datePipe.transform(date, format ?? 'yyyy-MM-ddTHH:mm:ss.SSS');
        return formattedDate;
    }

    filterByDate(input: any[], start: string, end: string): any[] {
        return input.filter(data => {
            let time = data[IData.Date]
            time = this.datePipe.transform(time, 'yyyy-MM-ddTHH:mm:ss.SSS');
            return time >= start && time <= end;
        })
    }

    calculateStats(input: any[][]): IStats {
        // Let's try to do this in one loop thru the data for performance sake since it is already a nested structure
        let totalRev = 0;
        let mostProfitableDay = { val: 0, date: '' }
        let mostExpensiveDay = { val: 0, date: '' }
        let totalExpenses = 0;
        input.forEach(day => {
            // add up products, services, recurring to get the daily revenue
            let dailyRev = day[IData.Products] + day[IData.Services] + day[IData.Recurring];
            // get the daily expenses
            let dailyExp = day[IData.Expenses];

            // Add the current day's revenue to the total for the period, same for expenses
            totalRev += dailyRev;
            totalExpenses += dailyExp;

            // if this daily value is higher than the previous high, it becomes the most profitable day
            if (dailyRev > mostProfitableDay.val) {
                mostProfitableDay = { val: dailyRev, date: day[IData.Date] }
            }
            // do the same thing for expenses
            if (dailyExp > mostExpensiveDay.val) {
                mostExpensiveDay = { val: dailyExp, date: day[IData.Date] }
            }
        })

        return <IStats>{ avgRev: totalRev / input.length, mostProfitableDay: mostProfitableDay, mostExpensiveDay: mostExpensiveDay, operatingExpenseRatio: totalExpenses / totalRev }
    }

    // TODO: set a type for returned display data
    groupByMonth(input: any[]): any[] {
        let result = [[]];
        // Since the data is already sorted by date, we will keep track of the first instance and get it's month
        let currMonth = moment(this.formatDate(input[0][IData.Date])).month().toString();
        let monthCounter = 0
        input.forEach(day => {
            if (moment(this.formatDate(day[IData.Date])).month().toString() != currMonth) {
                // if the month doesn't match, that means we are in a new month and increment the month counter
                monthCounter++;
                result[monthCounter] = [];
                currMonth = moment(this.formatDate(day[IData.Date])).month().toString();
            }
            // add the current day to the subarray with the other's from it's month
            result[monthCounter].push(day);
        })
        return this.reduceDays(result);
    }

    reduceDays(input: any[]): any[] {
        let result = [];
        
        input.forEach(interval => {
            let intervalMonth = this.formatDate(interval[0][IData.Date], 'MMM-yy')
            let intialVal = [intervalMonth,0,0,0,0]
            interval.reduce((prevDay, currDay) => {
                intialVal[IData.Expenses] += currDay[IData.Expenses]
                intialVal[IData.Recurring] += currDay[IData.Recurring]
                intialVal[IData.Products] += currDay[IData.Products]
                intialVal[IData.Services] += currDay[IData.Services]
                return intialVal;
            }), intialVal
            // once we have reduced the value we can reassign the interval
            result.push(intialVal);
        })
        return result;
    }
}
