# Database Scripts

This directory contains production-ready database scripts for seeding, cleaning, and verifying your Supabase database.

## 📁 Files

- `seed.ts` - Production seed script with test data
- `cleanup.ts` - Cleanup script to remove test data
- `verify-seed.ts` - Verification script to test seed data integrity
- `schema.prisma` - Prisma schema file

## 🚀 Quick Start

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Seed the Database
```bash
npm run db:seed
```

### 3. Verify Seed Data
```bash
npm run db:verify
```

### 4. Clean Up (Optional)
```bash
npm run db:cleanup
```

## 📊 Seed Data Created

The seed script creates the following test data:

### 👤 Admin User
- **Email**: `contact.exclusivelex@gmail.com`
- **Name**: Admin User
- **Role**: Default user role

### 📚 Collection
- **Name**: Test Collection
- **Owner**: Admin user
- **Description**: A sample collection for testing

### 🎬 Media Items
- **Type**: Video
- **File Path**: `https://example.com/media-item.mp4`
- **Thumbnail**: `https://example.com/media-thumbnail.jpg`
- **Linked to**: Test Collection

### 🎥 Hero Videos
- **Title**: Test Hero Video
- **Description**: A test hero video for production
- **Status**: Draft
- **Age Rating**: PG
- **Category**: Entertainment
- **Tags**: ['test', 'hero']

### 🎬 Collection Videos
- **Title**: Test Collection Video
- **Description**: A test video in a collection
- **Collection**: Test Collection
- **Order**: 1

### 🎥 Videos
- **Title**: Test Video
- **Description**: A test video for production
- **Type**: Monthly
- **Creator**: Admin user

## 🔧 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Seed** | `npm run db:seed` | Creates test data in the database |
| **Verify** | `npm run db:verify` | Verifies seed data integrity and relationships |
| **Cleanup** | `npm run db:cleanup` | Removes all test data from the database |

## 🔍 Verification Checks

The verification script checks:

1. ✅ Admin user exists with correct email
2. ✅ Test collection exists and is linked to admin user
3. ✅ Test media item exists and is linked to collection
4. ✅ Test hero video exists and is linked to admin user
5. ✅ Test collection video exists and is linked to admin user
6. ✅ Test video exists and is linked to admin user
7. ✅ All relationships are properly established

## 🧹 Cleanup Details

The cleanup script removes:

- All videos with "Test" in the title
- All collection videos with "Test" in the title
- All hero videos with "Test" in the title
- All media items with "test" in the description
- All collections with "Test" in the name
- *(Optional)* Admin user (commented out by default)

## ⚠️ Important Notes

### Production Safety
- The seed script uses `upsert` for the admin user to prevent duplicates
- All test data is clearly marked with "Test" in titles/descriptions
- Cleanup script only removes test data, preserving production data

### Database Schema
- All UUID fields use `randomUUID()` for proper generation
- Foreign key relationships are properly established
- Required fields are populated with appropriate default values

### Error Handling
- All scripts include comprehensive error handling
- Failed operations will exit with status code 1
- Database connections are properly closed after operations

## 🔄 Workflow

### Development Workflow
1. `npm run db:seed` - Create test data
2. `npm run db:verify` - Verify everything works
3. Develop and test your application
4. `npm run db:cleanup` - Clean up when done

### Production Deployment
1. `npm run db:seed` - Seed production database
2. `npm run db:verify` - Verify production data
3. Monitor application functionality

## 🛠️ Troubleshooting

### Common Issues

**UUID Generation Error**
```
Error creating UUID, invalid character
```
- Ensure you're using `randomUUID()` from the `crypto` module
- Check that all String ID fields are properly typed as UUIDs

**Foreign Key Constraint Error**
```
Foreign key constraint failed
```
- Run cleanup script first: `npm run db:cleanup`
- Ensure seed script creates records in correct order

**Connection Error**
```
Can't reach database server
```
- Verify `DATABASE_URL` in your `.env` file
- Check Supabase connection settings
- Ensure database is accessible from your network

### Debug Mode
Add `console.log` statements to any script for debugging:
```typescript
console.log('Debug:', { variable: value })
```

## 📝 Customization

### Adding New Test Data
1. Add new creation logic to `seed.ts`
2. Add verification logic to `verify-seed.ts`
3. Add cleanup logic to `cleanup.ts`
4. Update this README

### Modifying Existing Data
1. Update the data creation in `seed.ts`
2. Update verification checks in `verify-seed.ts`
3. Test with `npm run db:seed && npm run db:verify`

## 🔐 Security Notes

- Admin user email is hardcoded for consistency
- Test data uses example.com URLs (not real content)
- No sensitive data is included in seed scripts
- Cleanup script preserves production data

---

**Last Updated**: Database schema sync with Supabase manual changes
**Version**: Production-ready
**Status**: ✅ Ready for deployment 