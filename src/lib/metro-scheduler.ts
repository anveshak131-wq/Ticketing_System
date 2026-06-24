import type { Train, LineStation } from "@/types";

export interface ScheduleConfig {
  firstService: string; // HH:mm
  lastService: string;  // HH:mm
  headwayMinutes: number;
  peakHoursStart?: string; // HH:mm
  peakHoursEnd?: string;   // HH:mm
  peakHeadwayMinutes?: number;
  offPeakHeadwayMinutes?: number;
  sundayFirstService?: string;
  sundayLastService?: string;
}

export interface DepartureTime {
  time: string; // HH:mm
  isPeak: boolean;
  direction: "up" | "down";
}

export class MetroScheduler {
  /**
   * Generate departure times for a metro line based on schedule configuration
   */
  static generateDepartureTimes(config: ScheduleConfig, dayOfWeek: number = 1): DepartureTime[] {
    const isSunday = dayOfWeek === 0;
    const firstService = isSunday && config.sundayFirstService ? config.sundayFirstService : config.firstService;
    const lastService = isSunday && config.sundayLastService ? config.sundayLastService : config.lastService;
    
    const departures: DepartureTime[] = [];
    
    const [firstHour, firstMinute] = firstService.split(":").map(Number);
    const [lastHour, lastMinute] = lastService.split(":").map(Number);
    
    let currentTime = firstHour * 60 + firstMinute;
    const endTime = lastHour * 60 + lastMinute;
    
    const peakStart = config.peakHoursStart ? this.timeToMinutes(config.peakHoursStart) : null;
    const peakEnd = config.peakHoursEnd ? this.timeToMinutes(config.peakHoursEnd) : null;
    
    while (currentTime <= endTime) {
      const isPeak = peakStart && peakEnd && currentTime >= peakStart && currentTime <= peakEnd;
      const headway = isPeak && config.peakHeadwayMinutes 
        ? config.peakHeadwayMinutes 
        : config.offPeakHeadwayMinutes || config.headwayMinutes;
      
      const time = this.minutesToTime(currentTime);
      
      // Generate for both directions
      departures.push({ time, isPeak, direction: "up" });
      departures.push({ time, isPeak, direction: "down" });
      
      currentTime += headway;
    }
    
    return departures;
  }

  /**
   * Get next departure time from a station
   */
  static getNextDeparture(
    currentStation: string,
    lineStations: LineStation[],
    schedule: ScheduleConfig,
    targetDirection: "up" | "down",
    currentTime: Date = new Date()
  ): string | null {
    const departures = this.generateDepartureTimes(schedule, currentTime.getDay());
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Filter departures for the target direction
    const relevantDepartures = departures
      .filter(d => d.direction === targetDirection)
      .filter(d => this.timeToMinutes(d.time) > currentMinutes)
      .sort((a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time));
    
    return relevantDepartures[0]?.time || null;
  }

  /**
   * Get all departures for a time range
   */
  static getDeparturesInRange(
    startTime: string,
    endTime: string,
    schedule: ScheduleConfig,
    dayOfWeek: number = 1
  ): DepartureTime[] {
    const allDepartures = this.generateDepartureTimes(schedule, dayOfWeek);
    
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    return allDepartures.filter(d => {
      const time = this.timeToMinutes(d.time);
      return time >= startMinutes && time <= endMinutes;
    });
  }

  /**
   * Calculate travel time between stations
   */
  static calculateTravelTime(
    fromStation: string,
    toStation: string,
    lineStations: LineStation[],
    averageSpeedKmh: number = 40 // default average speed for metro
  ): number {
    const from = lineStations.find(s => s.stationCode === fromStation);
    const to = lineStations.find(s => s.stationCode === toStation);
    
    if (!from || !to) return 0;
    
    const distance = Math.abs(to.distanceFromStart - from.distanceFromStart);
    const travelTimeHours = distance / averageSpeedKmh;
    const travelTimeMinutes = Math.round(travelTimeHours * 60);
    
    // Add 1 minute for stopping at each intermediate station
    const stops = Math.abs(to.stopOrder - from.stopOrder);
    const stopTime = stops * 1; // 1 minute per stop
    
    return travelTimeMinutes + stopTime;
  }

  /**
   * Generate arrival time at destination
   */
  static calculateArrivalTime(
    departureTime: string,
    fromStation: string,
    toStation: string,
    lineStations: LineStation[]
  ): string {
    const travelTime = this.calculateTravelTime(fromStation, toStation, lineStations);
    const departureMinutes = this.timeToMinutes(departureTime);
    const arrivalMinutes = departureMinutes + travelTime;
    
    return this.minutesToTime(arrivalMinutes);
  }

  /**
   * Check if current time is during peak hours
   */
  static isPeakHours(currentTime: Date, schedule: ScheduleConfig): boolean {
    if (!schedule.peakHoursStart || !schedule.peakHoursEnd) return false;
    
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const peakStart = this.timeToMinutes(schedule.peakHoursStart);
    const peakEnd = this.timeToMinutes(schedule.peakHoursEnd);
    
    return currentMinutes >= peakStart && currentMinutes <= peakEnd;
  }

  /**
   * Get frequency based on current time
   */
  static getCurrentFrequency(currentTime: Date, schedule: ScheduleConfig): number {
    if (this.isPeakHours(currentTime, schedule)) {
      return schedule.peakHeadwayMinutes || schedule.headwayMinutes;
    }
    return schedule.offPeakHeadwayMinutes || schedule.headwayMinutes;
  }

  /**
   * Convert HH:mm to minutes since midnight
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to HH:mm
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  /**
   * Format time range for display
   */
  static formatTimeRange(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
  }

  /**
   * Get service summary for a line
   */
  static getServiceSummary(schedule: ScheduleConfig): {
    firstService: string;
    lastService: string;
    peakHours: string;
    frequency: string;
  } {
    const peakHours = schedule.peakHoursStart && schedule.peakHoursEnd
      ? `${schedule.peakHoursStart} - ${schedule.peakHoursEnd}`
      : "No peak hours defined";
    
    let frequency = `${schedule.headwayMinutes} min`;
    if (schedule.peakHeadwayMinutes && schedule.offPeakHeadwayMinutes) {
      frequency = `Peak: ${schedule.peakHeadwayMinutes} min, Off-peak: ${schedule.offPeakHeadwayMinutes} min`;
    }
    
    return {
      firstService: schedule.firstService,
      lastService: schedule.lastService,
      peakHours,
      frequency,
    };
  }
}

export { MetroScheduler };