import { Component, OnInit } from '@angular/core';
import { DataService, IChartData, IStats } from 'src/app/services/data.service';
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





  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getData().subscribe((response: any) => {
      // this.chartData = this.dataService.parse(response);
      this.chartData = response;
      this.currency = this.chartData.currencySymbol;
      this.data = this.dataService.parse(this.chartData.data, this.currency);
      this.columns = ['', ...this.chartData.legend]

      this.data = this.dataService.filterByDate(this.data, moment().subtract(30, 'days').toISOString(), moment().toISOString());
      this.stats = this.dataService.calculateStats(this.data);
      console.log('stats: ',this.stats)
      console.log(this.data);

    this.dataService.formatDate('3/11/2020');
  })
}

clearData(){
  this.data = this.dataService.parse(this.chartData.data, this.currency);
}

dateRangeSelected(event){
  console.log(event)
}

onSelect(event){
  console.log(event)
}

}
