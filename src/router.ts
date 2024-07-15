import { PrismaClient } from "@prisma/client";
import * as express from "express";
import moment from "moment";

import { GoogleSafebrowsingService } from "./services/GoogleSafebrowsing";
import { IpQualityScoreService } from "./services/IpQualityScore";
import { PhishermanService } from "./services/Phisherman";
import { SinkingYahtsService } from "./services/SinkingYahts";
import { VirusTotalService } from "./services/VirusTotal";
import { WalshyService } from "./services/Walshy";

const router = express.Router();
const prisma = new PrismaClient();

router.use((req, res, next) => {
  res.setHeader("X-Api-Version", `${process.env.npm_package_version!}`);

  if (process.env.NODE_ENV === "production") {
    res.setHeader("X-Api-Version-Status", "stable");
  } else if (process.env.NODE_ENV === "development") {
    res.setHeader("X-Api-Version-Status", "development");
  } else {
    res.setHeader("X-Api-Version-Status", "unknown");
  }

  // set xrobots tag
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  next();
});

/**
 * GET /
 * @summary Redirect to docs
 * @tags Main API Endpoints
 * @return {string} 301 - Redirect to /docs
 * @example response - 301 - Redirect to /docs
 *  "Redirecting to /docs"
 */
router.get("/", (req, res) => {
  res.status(301).redirect("/docs");
});

/**
 * GET /metrics
 * @summary Get the uptime and date started of the API
 * @tags Main API Endpoints
 * @return {object} 200 - Success message
 * @example response - 200 - Success message
 * {
 *  "status": "up",
 * "uptime": "00:00:00",
 * "dateStarted": "01-01-21 0:0:0 AM +00:00"
 * }
 *
 */
router.get("/metrics", (req, res) => {
  let uptime = process.uptime();
  // format the uptime
  let uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

  let dateStarted = new Date(Date.now() - uptime * 1000);
  // format the date started with moment
  let dateStartedFormatted = moment(dateStarted).format("MM-DD-YY H:m:s A Z");

  res.status(200).json({
    status: "up",
    uptime: uptimeString,
    dateStarted: dateStartedFormatted,
  });
});

/**
 * GET /check
 * @summary Checks if a domain is classified as something malicious (scam, phishing, etc.)
 * @tags Main API Endpoints
 * @param {string} domain.query.required - domain to check
 * @return {string} 200 - Success message
 * @return {string} 400 - Error message
 * @example response - 200 - Success message
 * "Check!"
 * @example response - 400 - Error: No domain parameter
 * "No domain parameter found"
 * @example response - 400 - Error: Invalid domain parameter
 * "Invalid domain parameter, should be a top level domain. Ex: google.com, amazon.com"
 *
 */
router.get("/check", async (req, res) => {
  // look for the query parameter
  const query = req.query!;

  let domain: string = query.domain! as string;

  // check for domain parameter
  if (!domain) {
    res.status(400).json("No domain parameter found");
  }

  // validate the domain (should be a top level domain
  // and not a subdomain
  // ex: google.com amazn.com
  // not: mail.google.com, docs.google.com)

  let regex = new RegExp("^[a-zA-Z0-9-]{1,63}.[a-zA-Z]{2,}$");
  if (!regex.test(domain)) {
    res
      .status(400)
      .json(
        "Invalid domain parameter, should be a top level domain. Ex: google.com, amazon.com",
      );
  }

  const walshy = new WalshyService();
  const ipQualityScore = new IpQualityScoreService();
  const googleSafebrowsing = new GoogleSafebrowsingService();
  const sinkingYahts = new SinkingYahtsService();
  const virusTotal = new VirusTotalService();
  const phisherman = new PhishermanService();

  let walshyData = await walshy.check(domain, prisma);
  let ipQualityScoreData = await ipQualityScore.check(domain, prisma);
  let googleSafebrowsingData = await googleSafebrowsing.check(domain, prisma);
  let sinkingYahtsData = await sinkingYahts.check(domain, prisma);
  let virusTotalData = await virusTotal.check(domain, prisma);
  let phishermanData = await phisherman.check(domain, prisma);

  // let dbDomain = await prisma.domain.findUnique({
  //   // @ts-expect-error
  //   where: {
  //     domain: domain,
  //   },
  // });

  let dbDomain = await prisma.domain.findFirst({
    where: {
      domain: domain,
    },
  });

  if (!dbDomain) {
    dbDomain = await prisma.domain.create({
      data: {
        domain: domain,
      },
    });
  }

  // todo: figure out why ts is complaining about this
  // @ts-expect-error
  let dbWalshyResponse = await prisma.WalshyAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      badDomain: walshyData.badDomain,
      data: walshyData,
    },
  });

  // todo: figure out why ts is complaining about this
  // @ts-expect-error
  let dbIpQualityScoreResponse = await prisma.IpQualityScoreAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      proxy: ipQualityScoreData.proxy ? true : false,
      countryCode: ipQualityScoreData.country_code,
      data: ipQualityScoreData,
    },
  });

  // todo: figure out why ts is complaining about this
  // @ts-expect-error
  let dbPhishermanResponse = await prisma.PhishermanAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      classification: phishermanData.classification,
      verifiedPhish: phishermanData.verifiedPhish,
      data: phishermanData,
    },
  });

  // todo: figure out why ts is complaining about this
  // @ts-expect-error
  let dbSinkingYahtsResponse = await prisma.SinkingYachtsAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: sinkingYahtsData,
      status: sinkingYahtsData,
    },
  });

  // todo: figure out why ts is complaining about this
  // @ts-expect-error
  let dbVirusTotalResponse = await prisma.VirusTotalAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: virusTotalData,
      // virusTotalData.data.attributes.last_analysis_stats.malicious is 0 if false and 1 if true, convert to boolean
      malicious: virusTotalData.data.attributes.last_analysis_stats.malicious
        ? true
        : false,
      suspicious: virusTotalData.data.attributes.last_analysis_stats.suspicious
        ? true
        : false,
    },
  });

  res.status(200).json({
    walshy: walshyData,
    ipQualityScore: ipQualityScoreData,
    googleSafebrowsing: googleSafebrowsingData,
    sinkingYahts: sinkingYahtsData,
    virusTotal: virusTotalData,
    phisherman: phishermanData,
  });
});

/**
 * POST /report
 * @summary Report a domain as malicious
 * @tags Main API Endpoints
 * @return {string} 200 - Success message
 * @return {string} 400 - Error message
 * @example response - 200 - Success message
 * "Report!"
 */
router.post("/report", (req, res) => {
  res.status(200).json("Report!");
});

export default router;
