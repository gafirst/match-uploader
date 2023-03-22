import { Match } from "@src/models/Match"
import { assert } from "console"

// modified real tba data
const testJson = [{
  "actual_time": 1678550871,
  "alliances": {
    "blue": {
      "dq_team_keys": [],
      "score": 41,
      "surrogate_team_keys": [],
      "team_keys": [
        "frc1311",
        "frc5219",
        "frc8865"
      ]
    },
    "red": {
      "dq_team_keys": [],
      "score": 47,
      "surrogate_team_keys": [],
      "team_keys": [
        "frc6341",
        "frc7104",
        "frc6944"
      ]
    }
  },
  "comp_level": "qm",
  "event_key": "2023gadal",
  "key": "2023gadal_qm50",
  "match_number": 50,
  "predicted_time": 1678550982,
  "set_number": 1,
  "time": 1678550640,
  "winning_alliance": "red"
},
{
  "actual_time": 1678468384,
  "alliances": {
    "blue": {
      "dq_team_keys": [],
      "score": 36,
      "surrogate_team_keys": [],
      "team_keys": [
        "frc5900",
        "frc6944",
        "frc1758"
      ]
    },
    "red": {
      "dq_team_keys": [],
      "score": 34,
      "surrogate_team_keys": [],
      "team_keys": [
        "frc7104",
        "frc1648",
        "frc8080"
      ]
    }
  },
  "comp_level": "sf",
  "event_key": "2023gadal",
  "key": "2023gadal_sf6m1",
  "match_number": 1,
  "predicted_time": 1678468432,
  "set_number": 6,
  "time": 1678467000,
  "winning_alliance": "blue"
}]


it('should parse an array from TBA', async () => {
  const testMatches = Match.fromJsonArr(testJson)
  assert(testMatches.length === 2, 'has two items')
  assert(testMatches[0].getMatchName() === 'Qualification Match 50', 'parses match name')
  assert(testMatches[1].getMatchName() === 'Playoffs Match 6', 'parses playoff match name')
})
