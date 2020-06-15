import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';



export interface IChartData {
  chartSubTitle: string,
  chartTitle: string,
  currencySymbol: string,
  data: any[]
  legend: string[]
}

// interface IDailyData {
//   date: string,
//   services: number,
//   products: number,
//   recurring: number,
//   expenses: number
// }

export enum Data {
  Date = 0,
  Services = 1,
  Products = 2,
  Recurring = 3,
  Expenses = 4
}

export interface IStats {
  avgRev: number,
  mostProfitableDay: {val: number, date: string},
  mostExpensiveDay: {val: number, date: string},
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

      // this creates an object with a numerical value and a display value to be consumed by the google charts
      // el[1] = el[1].map(num => {
      //   return { v: num, f: currency + Number(num).toLocaleString() }
      // });

      return [el[0], ...el[1]]
    })
  }

  formatDate(date) {
    // let formattedDate = this.datePipe.transform(date, 'MMMd');
    let formattedDate = this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm:ss.SSS');
    console.log(formattedDate);
    return formattedDate;
  }

  filterByDate(input: any[], start: string, end: string): any[] {
    return input.filter(data => {
      let time = data[0]
      time = this.datePipe.transform(time, 'yyyy-MM-ddTHH:mm:ss.SSS');
      return time > start && time < end;
    })
  }

  calculateStats(input: any[][]): IStats {
    // Let's try to do this in one loop thru the data for performance sake since it is already a nested structure
    let totalRev = 0;
    let mostProfitableDay = { val: 0, date: '' }
    let mostExpensiveDay = { val: 0, date: '' }
    let totalExpenses = 0;
      input.forEach(day => {
        console.log('current day: ', day)
        // add up products, services, recurring to get the daily revenue
        let dailyRev = day[Data.Products] + day[Data.Services] + day[Data.Recurring];
        // get the daily expenses
        let dailyExp = day[Data.Expenses];

        // Add the current day's revenue to the total for the period, same for expenses
        totalRev += dailyRev;
        totalExpenses += dailyExp;

        // if this daily value is higher than the previous high, it becomes the most profitable day
        if(dailyRev > mostProfitableDay.val){
          mostProfitableDay = {val: dailyRev, date: day[Data.Date]}
        }
        // do the same thing for expenses
        if(dailyExp > mostExpensiveDay.val){
          mostExpensiveDay = {val: dailyExp, date: day[Data.Date]}
        }
    })

    return <IStats>{avgRev: totalRev/input.length, mostProfitableDay: mostProfitableDay, mostExpensiveDay: mostExpensiveDay, operatingExpenseRatio: totalExpenses/totalRev}
  }
}
