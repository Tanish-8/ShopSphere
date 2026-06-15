import mongoose from "mongoose";
import dns from "node:dns";
import { resolveSrv, resolveTxt } from "node:dns/promises";

// ---------------------------------------------------------------------------
// Force IPv4-first globally
// ---------------------------------------------------------------------------
dns.setDefaultResultOrder("ipv4first");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// SRV Workaround for Node.js v24
// ---------------------------------------------------------------------------
// Node v24's c-ares DNS resolver fails SRV lookups on many Windows setups
// (querySrv ECONNREFUSED). This function manually resolves the SRV record
// and builds a standard mongodb:// URI so the driver never calls resolveSrv.
// ---------------------------------------------------------------------------
async function resolveSrvUri(srvUri) {
  // Only transform mongodb+srv:// URIs
  if (!srvUri.startsWith("mongodb+srv://")) {
    return srvUri; // Already a standard URI — pass through
  }

  console.log("🔧 Resolving SRV record manually (Node v24 workaround)...");

  // Parse the SRV URI
  // Format: mongodb+srv://user:pass@host/db?params
  const withoutScheme = srvUri.replace("mongodb+srv://", "");
  const atIndex = withoutScheme.indexOf("@");
  const credentials = withoutScheme.substring(0, atIndex); // user:pass
  const rest = withoutScheme.substring(atIndex + 1); // host/db?params
  const slashIndex = rest.indexOf("/");
  const srvHost = slashIndex !== -1 ? rest.substring(0, slashIndex) : rest;
  const dbAndParams = slashIndex !== -1 ? rest.substring(slashIndex) : "";

  const srvName = `_mongodb._tcp.${srvHost}`;

  try {
    // Resolve SRV records to get actual shard hostnames
    const srvRecords = await resolveSrv(srvName);
    const hosts = srvRecords
      .map((r) => `${r.name}:${r.port}`)
      .join(",");

    console.log(`   ✅ Resolved ${srvRecords.length} shard(s): ${hosts}`);

    // Resolve TXT records to get extra connection options (e.g. authSource)
    let txtParams = "";
    try {
      const txtRecords = await resolveTxt(srvHost);
      if (txtRecords.length > 0) {
        txtParams = txtRecords[0].join("");
      }
    } catch {
      // TXT records are optional
    }

    // Build standard mongodb:// URI
    let standardUri = `mongodb://${credentials}@${hosts}${dbAndParams}`;

    // Append TXT params (usually authSource=admin&replicaSet=...)
    if (txtParams) {
      const separator = standardUri.includes("?") ? "&" : "?";
      standardUri += `${separator}${txtParams}`;
    }

    // Ensure ssl=true (Atlas always requires TLS)
    if (!standardUri.includes("ssl=") && !standardUri.includes("tls=")) {
      const separator = standardUri.includes("?") ? "&" : "?";
      standardUri += `${separator}tls=true`;
    }

    console.log("   ✅ Built standard connection string successfully");
    return standardUri;
  } catch (srvError) {
    console.warn(
      `   ⚠️  SRV resolve failed (${srvError.message}), using hardcoded fallback...`
    );

    // ---------------------------------------------------------------------------
    // Hardcoded fallback — extracted from nslookup on this machine.
    // Update these if your Atlas cluster changes.
    // ---------------------------------------------------------------------------
    const fallbackHosts = [
      "ac-yddukvb-shard-00-00.svvuis5.mongodb.net:27017",
      "ac-yddukvb-shard-00-01.svvuis5.mongodb.net:27017",
      "ac-yddukvb-shard-00-02.svvuis5.mongodb.net:27017",
    ].join(",");

    let fallbackUri = `mongodb://${credentials}@${fallbackHosts}${dbAndParams}`;

    if (
      !fallbackUri.includes("ssl=") &&
      !fallbackUri.includes("tls=")
    ) {
      const sep = fallbackUri.includes("?") ? "&" : "?";
      fallbackUri += `${sep}tls=true`;
    }

    if (!fallbackUri.includes("authSource=")) {
      const sep = fallbackUri.includes("?") ? "&" : "?";
      fallbackUri += `${sep}authSource=admin`;
    }

    if (!fallbackUri.includes("replicaSet=")) {
      const sep = fallbackUri.includes("?") ? "&" : "?";
      fallbackUri += `${sep}replicaSet=atlas-12zjus-shard-0`;
    }

    console.log("   ✅ Using hardcoded shard addresses");
    return fallbackUri;
  }
}

// ---------------------------------------------------------------------------
// connectDB — main connection function
// ---------------------------------------------------------------------------
const connectDB = async () => {
  const rawUri = process.env.MONGO_URI;

  if (!rawUri) {
    console.error("❌ MONGO_URI is not defined in the environment variables.");
    console.error("   Create a .env file in /server with MONGO_URI set.");
    process.exit(1);
  }

  // Resolve SRV → standard URI (only transforms mongodb+srv://)
  const uri = await resolveSrvUri(rawUri);

  const options = {
    family: 4,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `🔄 MongoDB connection attempt ${attempt}/${MAX_RETRIES}...`
      );

      const conn = await mongoose.connect(uri, options);

      console.log("✅ MongoDB Connected Successfully");
      console.log(`   Host : ${conn.connection.host}`);
      console.log(`   DB   : ${conn.connection.name}`);
      return;
    } catch (error) {
      console.error(
        `❌ Attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
      );

      try {
        await mongoose.disconnect();
      } catch {
        // ignore
      }

      if (attempt < MAX_RETRIES) {
        console.log(
          `   Retrying in ${RETRY_DELAY_MS / 1000} seconds...\n`
        );
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error("\n❌ All connection attempts exhausted. Exiting.");
        console.error("   Troubleshooting checklist:");
        console.error(
          "   1. Verify MONGO_URI in .env is correct (username, password, cluster URL)"
        );
        console.error(
          "   2. Whitelist your IP in MongoDB Atlas → Network Access"
        );
        console.error(
          "   3. Check internet/DNS (try: nslookup google.com)"
        );
        process.exit(1);
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Mongoose event listeners
// ---------------------------------------------------------------------------
mongoose.connection.on("connected", () => {
  console.log("📗 Mongoose state: CONNECTED");
});
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  Mongoose state: DISCONNECTED");
});
mongoose.connection.on("reconnected", () => {
  console.log("✅ Mongoose state: RECONNECTED");
});
mongoose.connection.on("error", (err) => {
  console.error(`❌ Mongoose error: ${err.message}`);
});

export default connectDB;