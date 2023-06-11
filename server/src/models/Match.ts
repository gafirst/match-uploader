import { getSettings } from '@src/services/SettingsService'

export class Match {
  constructor (
    public matchKey: string,
    public eventKey: string,
    public compLevel: 'qm' | 'sf' | 'f',
    public setNumber: number,
    public matchNumber: number,

    public startTime: EpochTimeStamp,
    public endTime: EpochTimeStamp,

    public blue_keys: string[],
    public red_keys: string[],

    public blueScore: number,
    public redScore: number,

    public winner: 'blue' | 'red' | ''
  ) { }

  private static readonly compLevelString = {
    qm: 'Qualification Match',
    // qf: 'Quarterfinals Match',
    // sf: 'Playoffs Match',
    f: 'Finals Match'
  }

  public getMatchName (): string {
    if (this.compLevel === 'sf') return `Playoffs Match ${this.setNumber}`

    return `${Match.compLevelString[this.compLevel]} ${this.matchNumber}`
  }

  private getAllianceString (keys: string[]): string {
    return keys.reduce((a, b) => a + ', ' + b.substring(3)).substring(3)
  }

  // hardcode as a test for now...
  public async genVideoDescription (): Promise<string> {
    return `Footage of the ${(await getSettings()).eventName} is courtesy of GeorgiaFIRST A/V Team.

${this.getMatchName()}

Red Alliance  (${this.getAllianceString(this.blue_keys)}) - ${this.blueScore}
Blue Alliance (${this.getAllianceString(this.red_keys)}) - ${this.redScore}

To view match schedules and results for this event, visit The Blue Alliance Event Page: https://www.thebluealliance.com/event/${this.eventKey}

Follow us on Twitter (@GeorgiaFIRST) and Facebook (GeorgiaRobotics).

For more information and future event schedules, visit our website: www.gafirst.org

Thanks for watching!

Uploaded using the GeorgiaFIRST A/V Team Match Uploader (https://github.com/gafirst/match-uploader)`
  }

  static fromJsonArr (json: any[]): Match[] {
    return json.map((v, i, arr) => new Match(
      v.key,
      v.event_key,
      v.comp_level,
      v.set_number,
      v.match_number,
      v.actual_time,
      parseInt(v.actual_time) + 240000, // TODO: find this info somehow
      v.alliances.blue.team_keys,
      v.alliances.red.team_keys,
      v.alliances.blue.score,
      v.alliances.red.score,
      v.winning_alliance
    ))
  }
}
