export const appwriteConfig = {
  endpointUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT_URL!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  yeargroupCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_YEARGROUP_COLLECTION_ID!,
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  subjectsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_SUBJECTS_COLLECTION_ID!,
  booksCollectionId: process.env.NEXT_PUBLIC_APPWRITE_BOOKS_COLLECTION_ID!,
  assignmentsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_ASSIGNMENTS_COLLECTION_ID!,
  submissionsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_SUBMISSIONS_COLLECTION_ID!,
  lessonplanCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_LESSONPLANS_COLLECTION_ID!,

  booksBucketId: process.env.NEXT_PUBLIC_APPWRITE_BOOKS_BUCKET_ID!,
  secretKey: process.env.NEXT_APPWRITE_API_KEY!,
};
