/**
 * Returns the round number for a best of 3 match, given the semifinal match set number
 *
 * Round 1: matches 1-4
 * Round 2: matches 5-8
 * Round 3: matches 9-10
 * Round 4: matches 11-12
 * Round 5: match 13
 *
 * @param setNumber
 */
export function getBestOf3RoundNumberFromSetNumber(setNumber: number): number {
    // check if setnumber is positive and an integer and less than / equal to 13
    if (setNumber < 1 || !Number.isInteger(setNumber) || setNumber > 13) {
        // split the below line into 2
        throw new Error(`Set number for best of 3 '${setNumber}' is invalid: must be an integer between ` +
            "1 and 13, inclusive");
    }

    if (setNumber <= 4) {
        return 1;
    }

    if (setNumber <= 8) {
        return 2;
    }

    if (setNumber <= 10) {
        return 3;
    }
    if (setNumber <= 12) {
        return 4;
    }
    if (setNumber <= 13) {
        return 5;
    }

    throw new Error(`Invalid set number for best of 3 ${setNumber}`);
}
