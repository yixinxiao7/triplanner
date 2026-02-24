# Project Brief

What we're building, for whom, and why. Fill this in at the start of each new project.

---

## Project Name

triplanner

## One-Line Description

This app serves as a "hub" for a users coming trips, providing them with an itinerary-builder, an integrated calendar, as well as other tools to easily manage their travel.

## Platform

web

## Target Users

This is for travelers who like to plan out their trips in very fine details. These users like to plan every day out so that they know what restaurants they are going to, what things they are doing at every hour of the day as well as their accommodation and flights. They like have everything gathered in a central hub so they can easily get an overview of their trip to come. They like visuals, such as calendars or itineraries with an hourly breakdown.

## Problem Statement
*[What problem does this solve? Why does it matter?]*
This application fills a niche for planning trips, where users can put all of their trip information in one place. Instead of using google docs or Notion to keep track of everything, such as flights, hotels, airbnbs, attractions, itineraries, users can instead store all this information into triplanner. The application will help them easily modify their trip as needed, organize the destinations/attractions they are going to as well as store all information pertaining to the trip.

## Core Features (MVP)
*List the minimum set of features needed for a usable first version. Be specific — each feature should map to 1-3 sprint tasks.*

1. A simple login/create account mechanism, that authenticates users with username and password auth for now. The sign up form asks for the following info:
    - The users name
2. The home page should contain a list of existing trips the user is planning. Each listing should have the following:
    - The name of the destination(s)
    - The timeline of the trip
    - Status: PLANNING | ONGOING | COMPLETED
    - A link that brings them to another page that has more details on this trip.
3. A button to create a new trip. Clicking it opens a pop up that prompts the user for the name of the trip, as well as what destinations they are going to. After the user confirms, it brings them to an empty "trip details" page with the information they have filled in so far.
4. The "trip details" page contains an overview of the trip itself. It includes the following:
    - The name of the trip
    - A list of destinations the user is going to
    - A section that includes flight details. For each flight, it includes the following details:
        - the flight number
        - the airline
        - scheduled departure and arrival with local timezone times
        - fly from location and fly to location
    - A section that includes all housing accommodation. For each stay, it includes the following details:
        - Category of housing: HOTEL | AIRBNB | VRBO
        - The name of the stay (i.e. Hyatt Regency Maui)
        - The location/address of the housing
        - Check in date and time, and checkout date and time, in the local timezone times
    - A section that includes the itinerary of all activities in the trip. The itinerary includes the following details:
        - an hourly overview of any given day of the trip
        - planned activities (i.e. hike mt. fuji from 9am-12pm, eat at yumplings at 6pm on friday)
    - Finally, a calendar that integrates with all the sections above to show the user their planned travel/stays/activities. This calendar should actually be at the top of the page, so users can get a quick overview of their plans so far.
5. For each section of the "trip details" page (flights, stays, activities), there should be a method to edit them (with the exception of the calendar, which is edited automatically through the other 3 sections).
    - For each section, users should be easily able to modify any entry. This allows them to do things such as add flights, remove activities, modify hotels, etc.
    - Clicking the "edit" option takes them to the "edit" page, where they will actually make their modifications.
    - On the "edit" page, if the user clicks "save" after making changes, the changes will be saved and then the user will be brought back to the "trip details" page. If the user clicks "cancel", they are still routed back to the "trip details" page, but no changes are saved.
6. A navbar that allows users to easily navigate around the webapp. For now, a section for the home page is sufficient.
7. A way to delete trips.


## User Flows
*Describe the key user journeys. These help the Design Agent create accurate specs.*

### Flow 1: [New User]
1. A new user creates a new profile in the sign up page. They then sign in with these credentials.
2. The app shows them the home page. Since they are a new user, they should see no current trips. Instead, they see a button to plan their first trip.
3. The user clicks on the button to plan their first page.
4. The app shows a popup that has fields to enter the name of the trip as well as what destinations they are going to.
5. After the user fills in this information, they press "create".
6. The app then routes them to an empty "trip details" page that has the name and destinations they just entered, along with empty sections for flights, stays and activities as well as an empty calendar.
7. The user sees buttons that lets them add their flight details, stay details and activity details in. The user starts by clicking the button to let them edit their flight details.
8. The app brings them to the "edit" page to edit their flight info.
9. The user adds their trip to California with Delta on flight DL12345 on 8/7/26. It departs at 6am ET and lands at 11am ET. They then save this information.
10. The app brings them back to the "trip details" page where they can now see the flight details they just entered. The flight shows the flight to California with the delta flight DL12345 on 8/7/26. It shows that it departs at 6am ET and lands at 8am PT (automatically adjusted for local time zone).
11. The user clicks the button to edit their stays info.
12. The app routes them to the "edit" page to edit their hotel info.
13. The user gives the details of a hotel called "hyatt regency SF" on 8/7 to 8/9, with a check in of 4pm and a checkout of 11am. They do not know the address of the hotel yet so they leave that section blank. They save this information.
14. The app brings them back to the "trip details" page where they can see their stays detail as well now. The stay displays everything they put in earlier, except a "not provided" for the address of the hotel.
15. The user clicks to the button to edit their activities.
16. The app routes them to the "edit" page to edit their activities.
17. The user puts the following detail into the available fields: they are going to fisherman's wharf on 8/8 from 9am to 2pm. They then click the "+" button.
18. The app populates another row with more fields for users to write activities in.
19. The user puts the following detail into the new fields: they are going to visit the golden gate bridge on 8/8 from 3pm to 7pm. They then click the "+" button.
20. The app populates another row with more fields for users to write activities in.
21. The user puts the following details into the new fields: They are going to eat at a dimsum place in china town on 8/9 from 9am-12pm. They then click "save".
22. The app saves the information and then routes them back to "trip details" page.
23. The user can now see their activities grouped by the day, listed hourly. The calendar is also populated now with the flight, stay and activities they have populated so far.

### Flow 2: [Seasoned User]
1. User logs in and is brought to the home page
2. On the home page, the application shows them all trips they are planning/completed.
3. They click on their trip to Iceland.
4. The app brings them to the "trip details" page that has all details pertaining to it, including the calendar, their fights, stays and activities.
5. The user clicks the option to edit their activities.
6. The app brings them to the "edit" page which allows them to edit their activities.
7. The user adds a new activity on a brand new day (not previously planned for), to take pictures of northern lights from 9pm to 11pm. They then press "Save".
8. The app saves these changes, and brings them back to the "trip details" page. The "trip details" page now reflects these newest changes, on both the activities section as well as the integrated calendar.



## Out of Scope (for now)
*What we are explicitly NOT building in the first version.*

- MFA login
- On the home page, a calendar that summarizes all of the user's upcoming trips.
- Feature to suggest popular attractions at the user's chosen destinations.
- Feature to auto-generate an itinerary given the user's chosen destination and dates.

## Success Criteria
*How do we know the MVP is successful? Include measurable outcomes where possible.*

- User is able to login and see that their data is retained
- User is able to sign out
- User is able to create a trip
- User is able to edit their trip
- User is able to delete their trip
- User can easily get a wholistic overview of their trip by viewing the calendar in any "trip detail" pages.

## Design Preferences (optional)
*Any visual or UX preferences: color scheme, style (minimal, playful, corporate), reference apps, etc.*

- Use the following color palette:
    - #02111B
    - #3F4045
    - #30292F
    - #5D737E
    - #FCFCFC

- For style, aim for a minimal aesthetic. Think "Japandi".

- For the font, use ibm plex mono.

---

*This document is written by the project owner and reviewed by the Manager Agent. It should be stable across sprints — update it only if the project direction fundamentally changes.*
