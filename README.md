# Toaster Reels: A Product Sharing Platform
A Next.js web app that allows users to browse through, upload and share videos of various digitally available products.
Live demo @http://35.232.48.168:3000/

Feature overview of the application
- Scroll through 9:16 videos of Products
- Like and share product videos
- Easily access shop URLs
- Upload your own product videos

## Website Architecture Diagram
![Blank diagram (1)](https://github.com/user-attachments/assets/c3ee5106-923f-484d-be90-5b2115b643ae)
<br/>
A diagram showcasing the general architecture of the web application is shown above.
<br/><br/>
## Technology Stack
The following technologies were utilized in the development process:
- <b>Next.js:</b> Used to build the application frontend and integrate with GCP services.
- <b>Firestore:</b> A NoSQL database, it was used to store metadata regarding the products (ex.videoID, title, likes, videoURL, etc)
- <b>Google Cloud Storage:</b> Stores the product videos as objects within an object storage bucket.
- <b>Docker:</b> Used to containerize the application, which made deployment to Google Compute Engine much more convenient.
- <b>Google Compute Engine:</b> Google's VM provider, used to serve the Next.js application 24/7 through an easily accessible endpoint.
<br/><br/>
## User Flow and working
<b>1. Website Initialization:</b> <br/>When the user first lands on the website, a connection is established between the client (The User's browser) and the Firestore database.

<b>2. Fetching Videos:</b> <br/>Then, the metadata regarding all product videos on the platform is fetched from Firestore and used to build a vertical carousel using the ".map" function in javascript.
Once this is done, the videos themselves are loaded in using the associated videoURLs. Each product in the carousel is identified by a <b>videoReel</b> component within Next.js.

<b>3. Interacting with Videos:</b> <br/>Users can then browse through, like and share every video within the application. Metadata affected by user interactions (ex. Liking a video) results in update operations being performed on the firestore database. Every video also has a Shop Now button clicking which will take the user to the web page of the brand associated with the product.

<b>4. Uploading your own Videos:</b> <br/>Users can also add their own videos to the platform, though the video will be displayed in a 9:16 frame and metadata information such as the Video Title, Shop URL and desired Tags (optional). The video provided by the user will be uploaded to the Google Cloud Storage bucket, and the videoURL will be used as a field in the construction of another videoReel component. Once this process is complete, the user will be provided with a shareable link to the product reel.
