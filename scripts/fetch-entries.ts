import pool from "../src/config/database";
import { Feed, FeedModel } from "../src/models/Feed";

async function fetchEntriesForAllFeeds() {
  try {
    console.log("Starting to fetch entries for all feeds...");

    // Get all feeds
    const { rows: feeds } = await pool.query<Feed>(
      "SELECT * FROM feeds ORDER BY id",
    );

    console.log(`Found ${feeds.length} feeds to process`);

    let totalNewEntries = 0;
    let totalEntries = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each feed
    for (const f of feeds) {
      try {
        console.log(`\nProcessing: ${f.title} (${f.url})`);

        const result = await FeedModel.fetchEntries(f.id);

        console.log(`  - Found ${result.totalEntries} entries`);
        console.log(`  - Added ${result.newEntries} new entries`);

        totalNewEntries += result.newEntries;
        totalEntries += result.totalEntries;
        successCount++;
      } catch (error) {
        console.error(`  - Error: ${error}`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Summary:");
    console.log(`  Total feeds processed: ${feeds.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log(`  Total entries found: ${totalEntries}`);
    console.log(`  New entries added: ${totalNewEntries}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Error fetching entries:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
fetchEntriesForAllFeeds().catch((error) => {
  console.error("Failed to fetch entries:", error);
  process.exit(1);
});
