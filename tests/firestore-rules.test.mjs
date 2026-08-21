import { describe, test, before, beforeEach, after } from "node:test";
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
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";


const PROJECT_ID = "demo-quintrin";

const ADMIN_UID = "admin-test";
const INVESTOR_UID = "investor-test";
const OUTSIDER_UID = "outsider-test";
const INACTIVE_UID = "inactive-investor-test";

const ENGAGEMENT_ID = "QFSL-TEST-001";
const OTHER_ENGAGEMENT_ID = "QFSL-TEST-002";

let testEnv;


/* =========================================================
   TEST DATA SETUP
   ========================================================= */

async function seedDatabase() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

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
      doc(db, "portalUsers", INACTIVE_UID),
      {
        role: "investor",
        active: false,
        email: "inactive@example.test",
        displayName: "Inactive Investor"
      }
    );


    await setDoc(
      doc(db, "engagements", ENGAGEMENT_ID),
      {
        reference: ENGAGEMENT_ID,
        title: "Test Private Engagement",
        clientName: "Test Client",
        summary:
          "Test client engagement for secure investor review and decision workflow.",
        status: "Under Review",
        transactionAmount: 100000,
        currency: "USD",
        memberUids: [
          INVESTOR_UID,
          INACTIVE_UID
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );


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


    await setDoc(
      doc(
        db,
        "engagements",
        ENGAGEMENT_ID,
        "members",
        INACTIVE_UID
      ),
      {
        role: "investor",
        access: "active"
      }
    );


    await setDoc(
      doc(db, "engagements", OTHER_ENGAGEMENT_ID),
      {
        reference: OTHER_ENGAGEMENT_ID,
        title: "Other Private Engagement",
        clientName: "Other Test Client",
        summary: "Engagement not assigned to the test investor.",
        status: "Under Review",
        transactionAmount: 50000,
        currency: "USD",
        memberUids: [
          OUTSIDER_UID
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );


    await setDoc(
      doc(
        db,
        "engagements",
        OTHER_ENGAGEMENT_ID,
        "members",
        OUTSIDER_UID
      ),
      {
        role: "investor",
        access: "active"
      }
    );


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
       PORTAL USERS
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
      "investor cannot read another investor profile",
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
      "admin can read another portal user profile",
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
       ENGAGEMENT ACCESS
       ===================================================== */

    test(
      "admin can read any engagement",
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
              ENGAGEMENT_ID
            )
          )
        );

        await assertSucceeds(
          getDoc(
            doc(
              db,
              "engagements",
              OTHER_ENGAGEMENT_ID
            )
          )
        );
      }
    );


    test(
      "assigned active investor can read their engagement",
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
      "unassigned investor cannot read another engagement",
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
      "inactive portal investor cannot read engagement",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INACTIVE_UID)
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
       DASHBOARD QUERY
       ===================================================== */

    test(
      "investor dashboard query returns assigned engagements",
      async () => {
        const db =
          testEnv
            .authenticatedContext(INVESTOR_UID)
            .firestore();

        const investorQuery = query(
          collection(
            db,
            "engagements"
          ),
          where(
            "memberUids",
            "array-contains",
            INVESTOR_UID
          )
        );

        const snapshot =
          await assertSucceeds(
            getDocs(investorQuery)
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
      "investor cannot list every engagement without an assignment filter",
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


    /* =====================================================
       MEMBERSHIP RECORDS
       ===================================================== */

    test(
      "investor can read their own membership record",
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
              "members",
              INVESTOR_UID
            )
          )
        );
      }
    );


    test(
      "investor cannot change their membership record",
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
              "members",
              INVESTOR_UID
            ),
            {
              access: "active",
              role: "admin"
            }
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
      }
    );


    test(
      "investor can update their decision while preserving submittedAt",
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
      "investor cannot reset original submittedAt timestamp",
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
      "unassigned investor cannot submit decision for engagement",
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
                "This write must be rejected.",

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
      "investor cannot submit a decision using another UID",
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
              "decisions",
              OUTSIDER_UID
            ),
            {
              investorUid:
                OUTSIDER_UID,

              status:
                "Approved to Proceed",

              notes:
                "Invalid UID test.",

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
      "assigned investor can read engagement updates",
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
      "investor cannot create official engagement updates",
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
                "Investor must not create official Quintrin updates.",

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
       DOCUMENT METADATA
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
