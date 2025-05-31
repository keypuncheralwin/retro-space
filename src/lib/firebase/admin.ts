import { initializeApp, cert, getApps, App } from 'firebase-admin/app'; // Removed FirebaseError type import as it's not used for instanceof
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let adminApp: App | undefined = undefined;
let adminAuthService: Auth;
let adminDbService: Firestore;

const apps = getApps();

if (!apps.length) {
  if (projectId && clientEmail && privateKey) {
    console.log(`Firebase Admin SDK: Preparing to initialize. ProjectId: ${projectId}`);
    let credentialObject;
    try {
      const serviceAccount = {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Ensure actual newlines
      };
      console.log('Firebase Admin SDK: Service account object for cert():', {
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKeyPreview: serviceAccount.privateKey ? serviceAccount.privateKey.substring(0, 70) + "..." : "(privateKey is undefined/empty)",
      });
      credentialObject = cert(serviceAccount);
      console.log('Firebase Admin SDK: cert() call successful. Credential object created.');
    } catch (certError: any) {
      console.error('Firebase Admin SDK: Error during cert() call:', certError.message, certError.stack);
      // If cert fails, credentialObject will be undefined, and initializeApp will likely fail or not be called.
    }

    if (credentialObject) {
      try {
        adminApp = initializeApp({ credential: credentialObject });
        console.log('Firebase Admin SDK: initializeApp() call successful.');
      } catch (initError: any) {
        console.error('Firebase Admin SDK: Error during initializeApp() call:', initError.message, initError.stack);
        // Check for a 'code' property to identify Firebase errors, as FirebaseError is a type.
        if (initError && typeof initError === 'object' && 'code' in initError) {
            console.error('Firebase Admin SDK: FirebaseError details:', JSON.stringify(initError, null, 2));
        }
      }
    } else {
      console.error('Firebase Admin SDK: Credential object not created due to cert() error. Cannot initialize app.');
    }

  } else {
    console.error('Firebase Admin SDK: Missing environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY). Cannot initialize.');
  }
} else {
  adminApp = apps[0]; // Use the already initialized app
  console.log('Firebase Admin SDK: Already initialized, using existing app.');
}

if (adminApp) {
  adminAuthService = getAuth(adminApp);
  adminDbService = getFirestore(adminApp);
} else {
  console.error("Firebase Admin SDK: App is not initialized. Firebase admin services (Auth, Firestore) will not be available.");
  const uninitializedServiceProxyHandler = {
    get: (target: any, prop: string | symbol) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally' || prop === 'constructor' || typeof prop === 'symbol') {
        return undefined;
      }
      throw new Error(`Firebase Admin App not initialized. Cannot access property '${String(prop)}' on the service. Check server logs for initialization errors.`);
    }
  };
  adminAuthService = new Proxy({}, uninitializedServiceProxyHandler) as Auth;
  adminDbService = new Proxy({}, uninitializedServiceProxyHandler) as Firestore;
}

export const adminAuth = adminAuthService;
export const adminDb = adminDbService;




