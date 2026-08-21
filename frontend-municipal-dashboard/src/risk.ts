export type RiskLevel="Low"|"Medium"|"Critical";
export function vulnerabilityScore(blockageSeverity:number,culvertImportance:number,forecastedRainfall:number){return blockageSeverity*culvertImportance+forecastedRainfall*0.5;}
export function riskLevel(score:number):RiskLevel{return score>=7?"Critical":score>=4?"Medium":"Low";}
