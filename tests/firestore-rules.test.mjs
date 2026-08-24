import {
  describe,
  test,
  before,
  beforeEach,
  after
} from "node:test";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";


const PROJECT_ID = "demo-quintrin";

const ADMIN_UID = "admin-test";
const INVESTOR_UID = "investor-test";
const OUTSIDER_UID = "outsider-test";
const INACTIVE_USER_UID = "inactive-user-test";
const REVOKED_UID = "revoked-investor-test";
const CLIENT_UID = "client-test";

const ENGAGEMENT_ID = "QFSL-TEST-001";
const OTHER_ENGAGEMENT_ID = "QFSL-TEST-002";

let testEnv;


/* =========================================================
   DATABASE SEED
   ========================================================= */

async function seedDatabase() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();


    /* -----------------------------------------------------
       PORTAL USERS
       ----------------------------------------------------- */

    await setDoc(
      doc(db, "portalUsers", ADMIN_UID),
      {
        role: "admin",
        active: true,
        email: "admin@example.test",
        displayName: "Test Administrator"
      }
    );

    await setDoc(
      doc(db, "portalUsers", INVESTOR_UID),
      {
        role: "investor",
        active: true,
        email: "investor@example.test",
        displayName: "Test Investor"
      }
    );

    await setDoc(
      doc(db, "portalUsers", OUTSIDER_UID),
      {
        role: "investor",
        active: true,
        email: "outsider@example.test",
        displayName: "Unassigned Investor"
      }
    );

    await setDoc(
      doc(db, "portalUsers", INACTIVE_USER_UID),
      {
        role: "investor",
        active: false,
        email: "inactive@example.test",
        displayName: "Inactive Portal Investor"
      }
    );

    await setDoc(
      doc(db, "portalUsers", REVOKED_UID),
      {
        role: "investor",
        active: true,
        email: "revoked@example.test",
        displayName: "Revoked Investor"
      }
    );

    await setDoc(
      doc(db, "portalUsers", CLIENT_UID),
      {
        role: "client",
        active: true,
        email: "client@example.test",
        displayName: "Test Private Client"
      }
    );


    /* -----------------------------------------------------
       PRIVATE ENGAGEMENTS
       ----------------------------------------------------- */

    await setDoc(
      doc(db, "engagements", ENGAGEMENT_ID),
      {
        reference: ENGAGEMENT_ID,
        title: "Test Private Engagement",
        clientName: "Test Client",
        summary:
          "Test engagement for secure private portal review.",
        status: "Under Review",
        transactionAmount: 100000,
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    await setDoc(
      doc(db, "engagements", OTHER_ENGAGEMENT_ID),
      {
        reference: OTHER_ENGAGEMENT_ID,
        title: "Other Private Engagement",
        clientName: "Other Test Client",
        summary:
          "A separate engagement not assigned to the test investor.",
        status: "Under Review",
        transactionAmount: 50000,
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );


    /* -----------------------------------------------------
       USER-SPECIFIC ENGAGEMENT ASSIGNMENTS

       Authoritative assignment path:

       portalUsers/{uid}/engagements/{engagementId}
       ----------------------------------------------------- */

    await setDoc(
      doc(
        db,
        "portalUsers",
        INVESTOR_UID,
        "engagements",
        ENGAGEMENT_ID
      ),
      {
        role: "investor",
        access: "active",
        reference: ENGAGEMENT_ID,
        title: "Test Private Engagement",
        clientName: "Test Client",
        status: "Under Review",
        transactionAmount: 100000,
        currency: "USD",
        updatedAt: new Date()
      }
    );

    await setDoc(
      doc(
        db,
        "portalUsers",
        OUTSIDER_UID,
        "engagements",
        OTHER_ENGAGEMENT_ID
      ),
      {
        role: "investor",
        access: "active",
        reference: OTHER_ENGAGEMENT_ID,
        title: "Other Private Engagement",
        clientName: "Other Test Client",
        status: "Under Review",
        transactionAmount: 50000,
        currency: "USD",
        updatedAt: new Date()
      }
    );

    await setDoc(
      doc(
        db,
        "portalUsers",
        INACTIVE_USER_UID,
        "engagements",
        ENGAGEMENT_ID
      ),
      {
        role: "investor",
        access: "active",
        reference: ENGAGEMENT_ID,
        title: "Test Private Engagement",
        clientName: "Test Client",
        status: "Under Review",
        transactionAmount: 100000,
        currency: "USD",
        updatedAt: new Date()
      }
    );

    await setDoc(
      doc(
        db,
        "portalUsers",
        REVOKED_UID,
        "engagements",
        ENGAGEMENT_ID
      ),
      {
        role: "investor",
        access: "inactive",
        reference: ENGAGEMENT_ID,
        title: "Test Private Engagement",
        clientName: "Test Client",
        status: "Under Review",
        transactionAmount: 100000,
        currency: "USD",
        updatedAt: new Date()
      }
    );

    await setDoc(
      doc(
        db,
        "portalUsers",
        CLIENT_UID,
        "engagements",
        ENGAGEMENT_ID
      ),
      {
        role: "client",
        access: "active",
        reference: ENGAGEMENT_ID,
        title: "Test Private Engagement",
        clientName: "Test Client",
        status: "Under Review",
        transactionAmount: 100000,
        currency: "USD",
        updatedAt: new Date()
      }
    );


    /* -----------------------------------------------------
       LEGACY MEMBERSHIP RECORD
       ----------------------------------------------------- */

    await setDoc(
      doc(
        db,
        "engagements",
        ENGAGEMENT_ID,
        "members",
        INVESTOR_UID
      ),
      {
        role: "investor",
        access: "active"
      }
    );


    /* -----------------------------------------------------
       ENGAGEMENT UPDATE
       ----------------------------------------------------- */

    await setDoc(
      doc(
        db,
        "engagements",
        ENGAGEMENT_ID,
        "updates",
        "update-001"
      ),
      {
        title: "Portal test update",
        message:
          "Initial secure portal test update for this engagement.",
        createdBy: ADMIN_UID,
        createdAt: new Date()
      }
    );


    /* -----------------------------------------------------
       PRIVATE DOCUMENT METADATA
       ----------------------------------------------------- */

    await setDoc(
      doc(
        db,
        "engagements",
        ENGAGEMENT_ID,
        "documents",
        "document-001"
      ),
      {
        title: "Test Investment Summary",
        category: "Investment Summary",
        storagePath:
          "engagements/QFSL-TEST-001/test-document.pdf",
        uploadedAt: new Date()
      }
    );
  });
}


/* =========================================================
   TEST ENVIRONMENT
   ========================================================= */

describe(
  "Quintrin Firestore Security Rules",
  { concurrency: false },
  () => {

    before(async () => {
      const rules = await readFile(
        "firestore.rules",
        "utf8"
      );

      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          rules
        }
      });
    });


    beforeEach(async () => {
      await testEnv.clearFirestore();
      await seedDatabase();
    });


    after(async () => {
      await testEnv.cleanup();
    });


    /* =====================================================
       PORTAL USER PROFILE SECURITY
       ===================================================== */

    test(
      "investor can read their own portal profile",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "portalUsers",
              INVESTOR_UID
            )
          )
        );
      }
    );


    test(
      "investor cannot read another portal user's profile",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "portalUsers",
              OUTSIDER_UID
            )
          )
        );
      }
    );


    test(
      "investor cannot list all portal users",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          getDocs(
            collection(
              db,
              "portalUsers"
            )
          )
        );
      }
    );


    test(
      "admin can read another portal user's profile",
      async () => {
        const db =
          testEnv
            .authenticatedContext(ADMIN_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "portalUsers",
              INVESTOR_UID
            )
          )
        );
      }
    );


    /* =====================================================
       USER-SPECIFIC DASHBOARD INDEX
       ===================================================== */

    test(
      "investor can list their own engagement assignments",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDocs(
              collection(
                db,
                "portalUsers",
                INVESTOR_UID,
                "engagements"
              )
            )
          );

        assert.equal(
          snapshot.size,
          1
        );

        assert.equal(
          snapshot.docs[0].id,
          ENGAGEMENT_ID
        );
      }
    );


    test(
      "investor can read their own engagement assignment",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDoc(
              doc(
                db,
                "portalUsers",
                INVESTOR_UID,
                "engagements",
                ENGAGEMENT_ID
              )
            )
          );

        assert.equal(
          snapshot.data().access,
          "active"
        );
      }
    );


    test(
      "investor cannot read another user's engagement index",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          getDocs(
            collection(
              db,
              "portalUsers",
              OUTSIDER_UID,
              "engagements"
            )
          )
        );
      }
    );


    test(
      "investor cannot modify their assignment record",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          updateDoc(
            doc(
              db,
              "portalUsers",
              INVESTOR_UID,
              "engagements",
              ENGAGEMENT_ID
            ),
            {
              role: "admin"
            }
          )
        );
      }
    );


    test(
      "admin can read an investor engagement assignment",
      async () => {
        const db =
          testEnv
            .authenticatedContext(ADMIN_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "portalUsers",
              INVESTOR_UID,
              "engagements",
              ENGAGEMENT_ID
            )
          )
        );
      }
    );


    /* =====================================================
       GLOBAL ENGAGEMENT SECURITY
       ===================================================== */

    test(
      "assigned active investor can open their engagement",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDoc(
              doc(
                db,
                "engagements",
                ENGAGEMENT_ID
              )
            )
          );

        assert.equal(
          snapshot.data().reference,
          ENGAGEMENT_ID
        );
      }
    );


    test(
      "unassigned investor cannot open another engagement",
      async () => {
        const db =
          testEnv
            .authenticatedContext(OUTSIDER_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID
            )
          )
        );
      }
    );


    test(
      "inactive portal user cannot open engagement even with assignment",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INACTIVE_USER_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID
            )
          )
        );
      }
    );


    test(
      "revoked assignment cannot open engagement",
      async () => {
        const db =
          testEnv
            .authenticatedContext(REVOKED_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID
            )
          )
        );
      }
    );


    test(
      "investor cannot enumerate global engagements",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          getDocs(
            collection(
              db,
              "engagements"
            )
          )
        );
      }
    );


    test(
      "admin can enumerate global engagements",
      async () => {
        const db =
          testEnv
            .authenticatedContext(ADMIN_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDocs(
              collection(
                db,
                "engagements"
              )
            )
          );

        assert.equal(
          snapshot.size,
          2
        );
      }
    );


    test(
      "investor cannot modify the main engagement record",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          updateDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID
            ),
            {
              status: "Approved"
            }
          )
        );
      }
    );


    /* =====================================================
       EXACT INVESTOR PORTAL OPEN-SEQUENCE TESTS
       ===================================================== */

    test(
      "portal sequence step 1 - investor can get assigned global engagement",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID
            )
          )
        );
      }
    );


    test(
      "portal sequence step 2 - investor can list engagement updates",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDocs(
              collection(
                db,
                "engagements",
                ENGAGEMENT_ID,
                "updates"
              )
            )
          );

        assert.equal(
          snapshot.size,
          1
        );
      }
    );


    test(
      "portal sequence step 3 - investor can list document metadata",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDocs(
              collection(
                db,
                "engagements",
                ENGAGEMENT_ID,
                "documents"
              )
            )
          );

        assert.equal(
          snapshot.size,
          1
        );
      }
    );


    test(
      "portal sequence step 4 - investor can read missing own decision as not-found",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const snapshot =
          await assertSucceeds(
            getDoc(
              doc(
                db,
                "engagements",
                ENGAGEMENT_ID,
                "decisions",
                INVESTOR_UID
              )
            )
          );

        assert.equal(
          snapshot.exists(),
          false
        );
      }
    );


    /* =====================================================
       LEGACY MEMBERSHIP RECORDS
       ===================================================== */

    test(
      "investor cannot read legacy membership records",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "members",
              INVESTOR_UID
            )
          )
        );
      }
    );


    test(
      "admin can read legacy membership records",
      async () => {
        const db =
          testEnv
            .authenticatedContext(ADMIN_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "members",
              INVESTOR_UID
            )
          )
        );
      }
    );


    /* =====================================================
       INVESTOR DECISIONS
       ===================================================== */

    test(
      "assigned investor can create their own decision",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertSucceeds(
          setDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "decisions",
              INVESTOR_UID
            ),
            {
              investorUid:
                INVESTOR_UID,

              status:
                "Under Review",

              notes:
                "Initial investor review.",

              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    test(
      "investor can update decision while preserving submittedAt",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const decisionRef = doc(
          db,
          "engagements",
          ENGAGEMENT_ID,
          "decisions",
          INVESTOR_UID
        );

        await assertSucceeds(
          setDoc(
            decisionRef,
            {
              investorUid:
                INVESTOR_UID,

              status:
                "Under Review",

              notes:
                "Initial investor review.",

              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );

        await assertSucceeds(
          updateDoc(
            decisionRef,
            {
              status:
                "Approved to Proceed",

              notes:
                "Approved subject to final documentation.",

              updatedAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    test(
      "investor cannot reset original submittedAt",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const decisionRef = doc(
          db,
          "engagements",
          ENGAGEMENT_ID,
          "decisions",
          INVESTOR_UID
        );

        await assertSucceeds(
          setDoc(
            decisionRef,
            {
              investorUid:
                INVESTOR_UID,

              status:
                "Under Review",

              notes:
                "Initial investor review.",

              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );

        await assertFails(
          updateDoc(
            decisionRef,
            {
              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    test(
      "unassigned investor cannot submit a decision",
      async () => {
        const db =
          testEnv
            .authenticatedContext(OUTSIDER_UID)
            .firestore();

        await assertFails(
          setDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "decisions",
              OUTSIDER_UID
            ),
            {
              investorUid:
                OUTSIDER_UID,

              status:
                "Approved to Proceed",

              notes:
                "Unauthorized decision.",

              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    test(
      "revoked investor cannot submit a decision",
      async () => {
        const db =
          testEnv
            .authenticatedContext(REVOKED_UID)
            .firestore();

        await assertFails(
          setDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "decisions",
              REVOKED_UID
            ),
            {
              investorUid:
                REVOKED_UID,

              status:
                "Approved to Proceed",

              notes:
                "Revoked assignment decision attempt.",

              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    test(
      "client role cannot submit investor decision",
      async () => {
        const db =
          testEnv
            .authenticatedContext(CLIENT_UID)
            .firestore();

        await assertFails(
          setDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "decisions",
              CLIENT_UID
            ),
            {
              investorUid:
                CLIENT_UID,

              status:
                "Approved to Proceed",

              notes:
                "Client must not submit investor decision.",

              submittedAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    /* =====================================================
       ENGAGEMENT UPDATES
       ===================================================== */

    test(
      "assigned investor can read engagement update",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "updates",
              "update-001"
            )
          )
        );
      }
    );


    test(
      "client with active assignment can read engagement update",
      async () => {
        const db =
          testEnv
            .authenticatedContext(CLIENT_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "updates",
              "update-001"
            )
          )
        );
      }
    );


    test(
      "revoked user cannot read engagement update",
      async () => {
        const db =
          testEnv
            .authenticatedContext(REVOKED_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "updates",
              "update-001"
            )
          )
        );
      }
    );


    test(
      "investor cannot create official engagement update",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          setDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "updates",
              "investor-update"
            ),
            {
              title:
                "Unauthorized update",

              message:
                "Investor must not create official updates.",

              createdBy:
                INVESTOR_UID,

              createdAt:
                serverTimestamp()
            }
          )
        );
      }
    );


    /* =====================================================
       PRIVATE DOCUMENT METADATA
       ===================================================== */

    test(
      "assigned investor can read private document metadata",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "documents",
              "document-001"
            )
          )
        );
      }
    );


    test(
      "client with active assignment can read document metadata",
      async () => {
        const db =
          testEnv
            .authenticatedContext(CLIENT_UID)
            .firestore();

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "documents",
              "document-001"
            )
          )
        );
      }
    );


    test(
      "revoked user cannot read private document metadata",
      async () => {
        const db =
          testEnv
            .authenticatedContext(REVOKED_UID)
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "documents",
              "document-001"
            )
          )
        );
      }
    );


    test(
      "investor cannot modify private document metadata",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        await assertFails(
          updateDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID,
              "documents",
              "document-001"
            ),
            {
              title:
                "Unauthorized modification"
            }
          )
        );
      }
    );


    /* =====================================================
       LOGGED-OUT ACCESS
       ===================================================== */

    test(
      "logged-out visitor cannot read portal user",
      async () => {
        const db =
          testEnv
            .unauthenticatedContext()
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "portalUsers",
              INVESTOR_UID
            )
          )
        );
      }
    );


    test(
      "logged-out visitor cannot read private engagement",
      async () => {
        const db =
          testEnv
            .unauthenticatedContext()
            .firestore();

        await assertFails(
          getDoc(
            doc(
              db,
              "engagements",
              ENGAGEMENT_ID
            )
          )
        );
      }
    );

  }
);
