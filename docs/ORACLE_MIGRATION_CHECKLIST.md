# Oracle Migration Testing Checklist

## 🚀 **STEP-BY-STEP MIGRATION COMPLETION**

### 1. **Complete .env Setup**
```bash
# Update these values in your .env file:
ORACLE_USER=ADMIN
ORACLE_PASSWORD=your_actual_password
ORACLE_CONNECTION_STRING=your_db_name_high
TNS_ADMIN=./server
```

### 2. **Create Oracle Tables**
```sql
-- Run this in Oracle Cloud SQL Worksheet:
-- Copy and paste entire content of server/migrations/oracle_schema.sql
-- Click "Run Script"
```

### 3. **Test Oracle Connection**
```bash
cd server
node test-oracle-connection.js
```

### 4. **Import Data to Oracle**
```bash
cd server
node import-oracle-data.js
```

### 5. **Update Storage to Use Oracle**
```typescript
// In server/storage.ts, replace the export:
import { OracleStorage } from './oracle-storage.js';
export const storage = new OracleStorage();
```

### 6. **Start Application**
```bash
npm run dev
```

---

## 🧪 **API TESTING ENDPOINTS**

### **Notes API**
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### **Users API** 
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### **Classes API**
- `GET /api/classes` - List user's classes
- `POST /api/classes` - Create new class
- `DELETE /api/classes/:id` - Delete class

### **Test Commands**
```bash
# Test notes endpoint
curl http://localhost:5000/api/notes

# Create a test note
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note","content":"Testing Oracle migration"}'

# Check server logs
npm run dev
```

---

## 🎯 **UI TESTING CHECKLIST**

### **Frontend Features to Test:**
- [ ] Notes page loads without errors
- [ ] Can create new notes
- [ ] Can edit existing notes  
- [ ] Can delete notes
- [ ] Notes persist after browser refresh
- [ ] Classes page works
- [ ] Dashboard displays correctly
- [ ] User authentication works
- [ ] All data persists between sessions

### **Browser Testing:**
1. Open http://localhost:5173
2. Navigate to Notes section
3. Create a test note
4. Refresh browser
5. Verify note is still there
6. Test other features

---

## 🔍 **VERIFICATION STEPS**

### **Database Verification:**
```bash
# Check table counts
node server/test-oracle-connection.js

# Verify specific data
# (Use Oracle Cloud SQL Worksheet)
SELECT COUNT(*) FROM notes;
SELECT * FROM notes WHERE ROWNUM <= 5;
```

### **Application Verification:**
- All API endpoints return JSON (not HTML errors)
- Data persists between server restarts
- No PostgreSQL connection errors in logs
- Oracle connection successful in server logs

---

## 🎉 **SUCCESS CRITERIA**

✅ Oracle tables created successfully  
✅ CSV data imported to Oracle  
✅ Application connects to Oracle  
✅ All API endpoints work  
✅ Frontend loads and functions correctly  
✅ Data persists between sessions  
✅ No PostgreSQL dependencies remaining  

---

## 🛠 **TROUBLESHOOTING**

### **Common Issues:**
1. **"ORA-12514: TNS:listener does not currently know of service"**
   - Check ORACLE_CONNECTION_STRING in .env
   - Verify service name in tnsnames.ora

2. **"Cannot find module 'oracledb'"**
   - Run: `npm install oracledb`

3. **Wallet errors**
   - Ensure wallet files are in server/ directory
   - Check TNS_ADMIN path in .env

4. **Data import errors**
   - Verify Oracle tables exist before importing
   - Check CSV file formats match Oracle schema