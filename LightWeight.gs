/**************************************
 * MAIN FUNCTION (Scheduled hourly)
 **************************************/
function renameStravaActivitiesHourly() {
  try {
    // 1. Use your static Bearer token
    const accessToken = 'YOUR_STRAVA_BEARER_TOKEN';

    // 2. Get all recent activities (last 24h)
    const recentActivities = getRecentActivities(accessToken);

    // 3. Rename if not already renamed
    renameUnchangedActivities(recentActivities, accessToken);

  } catch (error) {
    Logger.log("Error in renameStravaActivitiesHourly: " + error);
  }
}

/************************************************
 * HELPER: Get the recent (last 24h) activities
 ************************************************/
function getRecentActivities(accessToken) {
  // Unix timestamp for 24 hours ago
  const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const url = `https://www.strava.com/api/v3/athlete/activities?after=${oneDayAgo}`;

  const options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return JSON.parse(response.getContentText());
  } else {
    throw new Error('Error fetching activities: ' + response.getContentText());
  }
}

/************************************************
 * HELPER: Rename Activities If Not Renamed Yet
 ************************************************/
function renameUnchangedActivities(activities, accessToken) {
  // Two lists of words to pick from
  const listOne = ["Oooh", "Yeah", "Light Weight", "Pow", "Let's gooo", "Gotta get good"];
  const listTwo = ["Buddy", "Baby"];

  // Retrieve or create a property to track renamed IDs
  const scriptProperties = PropertiesService.getScriptProperties();
  const renamedActivityIdsString = scriptProperties.getProperty('renamedActivityIds') || '[]';
  let renamedActivityIds = JSON.parse(renamedActivityIdsString);

  // For each activity in the last 24h
  for (const activity of activities) {
    const activityId = activity.id;
    const currentName = activity.name;

    // Skip if we've already renamed this activity
    if (renamedActivityIds.includes(activityId)) {
      continue;
    }

    // Generate the new name
    // e.g., "Oooh Baby" or "Light Weight Buddy"
    const randomIndexOne = Math.floor(Math.random() * listOne.length);
    const randomIndexTwo = Math.floor(Math.random() * listTwo.length);
    const newName = listOne[randomIndexOne] + " " + listTwo[randomIndexTwo];

    // Call Strava API to update the activity name
    const updateUrl = `https://www.strava.com/api/v3/activities/${activityId}`;
    const options = {
      method: 'put',
      payload: {
        name: newName
      },
      headers: {
        Authorization: 'Bearer ' + accessToken
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(updateUrl, options);
    if (response.getResponseCode() === 200) {
      // Mark this activity as renamed
      renamedActivityIds.push(activityId);
      Logger.log(`Renamed activity ID ${activityId} from "${currentName}" to "${newName}"`);
    } else {
      Logger.log(`Failed to rename activity ID ${activityId}: ` + response.getContentText());
    }
  }

  // Save the updated list of renamed IDs
  scriptProperties.setProperty('renamedActivityIds', JSON.stringify(renamedActivityIds));
}

/************************************************
 * OPTIONAL: Create a time-based trigger (once)
 ************************************************/
// Run this function once manually to set up the hourly trigger
function createHourlyTrigger() {
  ScriptApp.newTrigger('renameStravaActivitiesHourly')
    .timeBased()
    .everyHours(1)
    .create();
}
