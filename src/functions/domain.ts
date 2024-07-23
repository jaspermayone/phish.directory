import { prisma } from "../prisma";
import { GoogleSafebrowsingService } from "../services/GoogleSafebrowsing";
import { IpQualityScoreService } from "../services/IpQualityScore";
import { PhishObserverService } from "../services/PhishObserver";
import { PhishReportService } from "../services/PhishReport";
import { PhishermanService } from "../services/Phisherman";
import { SecurityTrailsService } from "../services/SecurityTrails";
import { SinkingYahtsService } from "../services/SinkingYahts";
import { UrlScanService } from "../services/UrlScan";
import { VirusTotalService } from "../services/VirusTotal";
import { WalshyService } from "../services/Walshy";

const walshy = new WalshyService();
const ipQualityScore = new IpQualityScoreService();
const googleSafebrowsing = new GoogleSafebrowsingService();
const sinkingYahts = new SinkingYahtsService();
const virusTotal = new VirusTotalService();
const phisherman = new PhishermanService();
const phishObserver = new PhishObserverService();
const urlScan = new UrlScanService();
const securitytrails = new SecurityTrailsService();
const phishreport = new PhishReportService();

export async function domainCheck(domain: string, dbDomain: any) {
  let walshyData = await walshy.check(domain, prisma);
  let ipQualityScoreData = await ipQualityScore.check(domain, prisma);
  let googleSafebrowsingData = await googleSafebrowsing.check(domain, prisma);
  let sinkingYahtsData = await sinkingYahts.check(domain, prisma);
  let virusTotalData = await virusTotal.check(domain, prisma);
  let phishermanData = await phisherman.check(domain, prisma);
  let phishObserverData = await phishObserver.check(domain, prisma);
  let urlScanData = await urlScan.check(domain, prisma);
  let securitytrailsData = await securitytrails.check(domain, prisma);
  let phishreportData = await phishreport.check(domain, prisma);

  let dbGbsResponse = await prisma.googleSafeBrowsingAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: googleSafebrowsingData,
    },
  });

  let dbIpQualityScoreResponse = await prisma.ipQualityScoreAPIResponse.create({
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

  for (const [domain, data] of Object.entries(phishermanData)) {
    const typedData = data as any;

    const dbPhishermanResponse = await prisma.phishermanAPIResponse.create({
      data: {
        domain: {
          connect: {
            id: dbDomain.id,
          },
        },
        classification: typedData.classification,
        verifiedPhish: typedData.verifiedPhish,
        data: typedData,
      },
    });
  }

  let dbSinkingYahtsResponse = await prisma.sinkingYachtsAPIResponse.create({
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

  let dbVirusTotalResponse = await prisma.virusTotalAPIResponse.create({
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

  let dbWalshyResponse = await prisma.walshyAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      badDomain: walshyData.badDomain,
      data: walshyData as any,
    },
  });

  let pojson = JSON.stringify(phishObserverData);

  let dbphishObserverResponse = await prisma.phishObserverAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: pojson,
    },
  });

  let dbUrlscanResponse = await prisma.urlScanAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: urlScanData,
    },
  });

  let dbSecurityTrailsResponse = await prisma.securityTrailsAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: securitytrailsData,
    },
  });

  let dbPhishReportResponse = await prisma.phishReportAPIResponse.create({
    data: {
      domain: {
        connect: {
          id: dbDomain.id,
        },
      },
      data: phishreportData,
    },
  });

  return {
    walshyData,
    ipQualityScoreData,
    googleSafebrowsingData,
    sinkingYahtsData,
    virusTotalData,
    phishermanData,
    phishObserverData,
    urlScanData,
    securitytrailsData,
  };
}
