import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecepientReportGeneratorComponent } from './recepient-report-generator.component';

describe('RecepientReportGeneratorComponent', () => {
  let component: RecepientReportGeneratorComponent;
  let fixture: ComponentFixture<RecepientReportGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepientReportGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecepientReportGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
