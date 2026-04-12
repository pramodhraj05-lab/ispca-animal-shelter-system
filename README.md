**ISPCA Animal Intake & Rehoming Tracker**

**Project Overview**
This project is a basic Information System designed for the Irish Society for the Prevention of Cruelty to Animals (ISPCA). The system helps manage rescued animals within a shelter by allowing staff to record animal details, update their status, and track their progress toward adoption.The goal is to improve visibility of animals currently in care and support better organisation within shelters.

**Problem Statement**
ISPCA shelters often handle a large number of rescued animals.Tracking their intake, health condition, and adoption status can become difficult, especially during periods of overcrowding. This system provides a structured way to manage that information.

**Features**
1. Add new rescued animals
2. View animals occupany in the shelter
3. Update adoption status
4. Delete/archive animals
5. Track adoption details with email ID
6. Status types: Available, Adopted, Medical Hold, Pending

**Shelters**
- Shows animal count vs capacity with a visual capacity bar
- 4 ISPCA shelters pre-seeded across Dublin, Cork, Galway, Limerick

**Adoptions**
1. Any logged-in user can submit an adoption request
2. Admin can update status: Pending → Approved / Rejected
3. Approving a request auto-marks the animal as Adopted
4. Rejecting reverts the animal back to Available

**Adoption Tracking**
1. Public endpoint — no login required
2. Track by email address or request ID
3. Available on login page (Track tab) and inside the dashboard

**Admin Panel**
1. View all registered users in a table
2. Admin-only: add/edit/delete animals, shelters, adoption status updates

**Technologies Used**
1. Frontend: HTML, CSS, JavaScript
2. Backend: Node.js, Express.js
3. Database: SQLite

**Screenshots**

<img width="1461" height="793" alt="Screenshot 2026-04-12 at 2 18 21 PM" src="https://github.com/user-attachments/assets/459466e0-63fa-4e5c-a46d-c0909ea41b3f" />

This screen is the main dashboard of the ISPCA Animal Shelter System, where all animals in the shelter are displayed along with their details such as name, species, age, gender, and status (available or adopted), while also showing summary statistics at the top and providing actions like adopt, edit, and delete for managing each animal efficiently.



<img width="1450" height="760" alt="Screenshot 2026-04-12 at 2 05 01 PM" src="https://github.com/user-attachments/assets/7ceedd0a-46ad-43f0-bc8d-fc7019808a28" />

This feature helps shelters register animals that need a home by storing their details and images in the system, making them visible to potential adopters and improving their chances of being adopted quickly and responsibly.

<img width="1454" height="798" alt="Screenshot 2026-04-12 at 2 19 22 PM" src="https://github.com/user-attachments/assets/fb508fe6-3cae-45d0-b6b1-1d925b221cba" />

This section displays all registered shelters with their location, contact details, and capacity. It helps manage how many animals each shelter can accommodate and track current occupancy. Admin users can also edit or delete shelter information, ensuring accurate and up-to-date records across the system.

<img width="1470" height="786" alt="Screenshot 2026-04-12 at 2 20 27 PM" src="https://github.com/user-attachments/assets/a5b4a3b1-9f49-433c-93f4-f9d59bb02c19" />

The adoptions module tracks all adoption requests by storing user details and linking them to specific animals, allowing administrators to review, manage, and update each request to ensure a smooth and responsible adoption process.


<img width="1462" height="795" alt="Screenshot 2026-04-12 at 2 21 42 PM" src="https://github.com/user-attachments/assets/7e8a5290-6e92-47ad-8931-ee66287e9b06" />

This feature allows administrators to update the details of an existing animal, such as its name, age, status, and image. It ensures that the information shown to potential adopters is always accurate and up to date, improving the chances of successful adoption.

<img width="1422" height="739" alt="Screenshot 2026-04-12 at 2 22 03 PM" src="https://github.com/user-attachments/assets/44be35ac-278a-42c8-849d-00ed4086d5fa" />

Before removing any animal record, the system shows a confirmation popup to prevent accidental deletion. This ensures data safety and gives the user a chance to cancel the action if it was triggered by mistake.

<img width="1467" height="785" alt="Screenshot 2026-04-12 at 2 23 54 PM" src="https://github.com/user-attachments/assets/6686f47f-5bca-4666-b55f-c6c3026110db" />

This feature allows users to track the status of their adoption request by entering their email address or request ID. It provides real-time updates on whether the request is pending, approved, or rejected, ensuring transparency and better communication between the shelter and the adopter.

<img width="1465" height="799" alt="Screenshot 2026-04-12 at 2 24 11 PM" src="https://github.com/user-attachments/assets/6dc02056-9626-41e9-94fd-2af3f96f36c6" />

This section displays all registered users in the system along with their roles, such as admin or customer. It helps administrators manage user access and monitor who is interacting with the system.

**Conclusion**

This project provides a simple and effective system for managing animal shelters and improving the adoption process. It allows administrators to easily track animal records, manage shelters, and handle adoption requests in an organized way. By combining a user-friendly interface with essential backend functionality, the system improves efficiency, transparency, and overall management of rescued animals. It serves as a practical solution for streamlining shelter operations and supporting better care and rehoming of animals.

**Reference**

### Youtube channels
- https://www.youtube.com/watch?v=RiOoYPxJAzk
- https://www.youtube.com/watch?v=6-mLnQAcRTg
- http://youtube.com/watch?v=DPgb7aa5bYs
- 
### AI Assistance
- ChatGPT (OpenAI) – Used for debugging, code explanation 



