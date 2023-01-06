import { Component, NgZone, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { take } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  /** Controls the rendering of components. */
  show = false;

  /** The number of times metrics will be gathered. */
  sampleSize = 100;

  /** The number of components being rendered */
  componentCount = 100;

  allSamples: number[] = [];

  isRunningBenchmark = false;

  displayedColumns: string[] = ["index", "time"];
  dataSource = new MatTableDataSource<{ index: number; time: string }>();

  get stdev(): number | undefined {
    if (!this.allSamples.length) {
      return undefined;
    }
    return Math.sqrt(
      this.allSamples.map((x) => Math.pow(x - this.mean!, 2)).reduce((a, b) => a + b) / this.allSamples.length
    );
  }

  get mean(): number | undefined {
    if (!this.allSamples.length) {
      return undefined;
    }
    return this.allSamples.reduce((a, b) => a + b) / this.allSamples.length;
  }

  constructor(private ngZone: NgZone) {}

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator!;
  }

  getTotalRenderTime(): string {
    return this.allSamples.length ? `${this.format(this.mean!)} ± ${this.format(this.stdev!)}` : "";
  }

  format(num: number): string {
    const roundedNum = Math.round(num * 100) / 100;
    return roundedNum >= 10 ? roundedNum.toFixed(2) : "0" + roundedNum.toFixed(2);
  }

  async runBenchmark(): Promise<void> {
    this.isRunningBenchmark = true;
    const samples = [];
    for (let i = 0; i < this.sampleSize; i++) {
      samples.push(await this.recordSample());
    }
    this.dataSource.data = this.dataSource.data.concat(
      samples.map((sample, i) => ({
        index: this.allSamples.length + i,
        time: this.format(sample),
      }))
    );
    this.allSamples.push(...samples);
    this.isRunningBenchmark = false;
  }

  recordSample(): Promise<number> {
    return new Promise((res) => {
      setTimeout(() => {
        this.show = true;
        const start = performance.now();
        this.ngZone.onStable.pipe(take(1)).subscribe(() => {
          const end = performance.now();
          this.show = false;
          res(end - start);
        });
      });
    });
  }
}
