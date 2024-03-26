// use to generate a unique process ID for the SMB Client connection
// Will generate a 32 bit integer split into the top and bottom 16 bits (high and low PID)
export class PIDGenerator {
  private static nextPID: number = 1; //
  private static activePIDs: Set<number> = new Set();

  static generatePID(): Buffer { //{ PIDHigh: number; PIDLow: number } { // will change to PIDHigh/Low in the future
    let combinedPID = PIDGenerator.nextPID++;

    // Check and skip 0xFFFF in PIDLow
    if ((combinedPID & 0xffff) === 0xffff) {
      combinedPID = PIDGenerator.nextPID++;
    }

    PIDGenerator.nextPID = combinedPID % 0x100000000; // PID should not exceed 32 bits

    const PIDHigh = (combinedPID >>> 16) & 0xffff; // get top 16 bits and store as "16 bit" integer
    const PIDLow = combinedPID & 0xffff; // zero out top 16 bits

    this.activePIDs.add(combinedPID);

    // return { PIDHigh, PIDLow };
    return Buffer.alloc(combinedPID);
  }

  static releasePID(PIDHigh: number, PIDLow: number): void {
    const combinedPID = (PIDHigh << 16) | PIDLow;
    this.activePIDs.delete(combinedPID);
  }
}
