const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage().bucket();

// Storage의 charactersIMG 폴더 내 모든 하위 파일 URL을 Firestore에 저장하는 함수
exports.storeCharacterImagesToFirestore = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Storage의 charactersIMG 폴더 내 모든 하위 폴더와 파일 가져오기
      const [files] = await storage.getFiles({prefix: "charactersIMG/"});

      const batch = db.batch();
      const allImgsCollection = db.collection("allIMGs");

      // 각 파일 처리
      for (const file of files) {
        const filePath = file.name;
        const fileName = filePath.split("/").pop();
        if (!fileName) continue; // 폴더 경로는 생략

        // 파일의 다운로드 URL 생성
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-09-2491", // 만료일 설정
        });

        // Firestore에 저장할 데이터 구조
        const docRef = allImgsCollection.doc(fileName);
        batch.set(docRef, {
          filePath,
          url,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Firestore 일괄 쓰기 실행
      await batch.commit();
      res.send("All image URLs successfully stored in Firestore.");
    } catch (error) {
      console.error("Error storing image URLs:", error);
      res.status(500).send("Error storing image URLs.");
    }
  });
});
