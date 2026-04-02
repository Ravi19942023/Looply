import { env } from "@/backend/config";
import { registerAllJobs } from "@/backend/jobs";
import { container } from "./container";
import { StorageAdapterFactory } from "@/backend/adapters/storage";
import { VectorAdapterFactory } from "@/backend/adapters/vector";
import { AnalyticsController, AnalyticsService, TransactionRepository } from "@/backend/modules/analytics";
import { AuditController, AuditRepository, AuditService } from "@/backend/modules/audit";
import { AuthController, AuthService, UserRepository } from "@/backend/modules/auth";
import { EmailAdapterFactory } from "@/backend/adapters/email";
import { EmailService } from "@/backend/modules/email/email.service";
import { CampaignController, CampaignRepository, CampaignService } from "@/backend/modules/campaigns";
import { ChatController, ChatService } from "@/backend/modules/chat";
import { ChatDocumentRepository, ChatFileController, ChatFileService } from "@/backend/modules/chat-files";
import { RedisCacheService } from "@/backend/lib/redis";
import { CustomerController, CustomerRepository, CustomerService } from "@/backend/modules/customers";
import { MemoryRepository, MemoryService } from "@/backend/modules/memory";
import { IngestionService, RagService } from "@/backend/modules/rag";
import { SettingsController, SettingsService } from "@/backend/modules/settings";
import { DocumentRepository, UploadController, UploadService } from "@/backend/modules/uploads";
import { TelemetryRepository, TelemetryService } from "@/backend/modules/telemetry";

let bootstrapPromise: Promise<typeof container> | null = null;

async function bootstrap(): Promise<typeof container> {
  const auditRepository = new AuditRepository();
  const transactionRepository = new TransactionRepository();
  const userRepository = new UserRepository();
  const campaignRepository = new CampaignRepository();
  const customerRepository = new CustomerRepository();
  const memoryRepository = new MemoryRepository();
  const documentRepository = new DocumentRepository();
  const chatDocumentRepository = new ChatDocumentRepository();
  const telemetryRepository = new TelemetryRepository();

  const emailAdapter = EmailAdapterFactory.create();
  const storageAdapter = StorageAdapterFactory.create();
  const vectorAdapter = VectorAdapterFactory.create();
  const auditService = new AuditService(auditRepository);
  const analyticsService = new AnalyticsService(transactionRepository, auditService);
  const authService = new AuthService(userRepository, auditService);
  const telemetryService = new TelemetryService(telemetryRepository);
  const emailService = new EmailService(emailAdapter, telemetryService);
  const campaignService = new CampaignService(
    campaignRepository,
    customerRepository,
    emailService,
    auditService,
  );
  const customerService = new CustomerService(customerRepository, auditService);
  const memoryService = new MemoryService(memoryRepository);
  const ingestionService = new IngestionService(telemetryService);
  const uploadService = new UploadService(
    documentRepository,
    storageAdapter,
    vectorAdapter,
    ingestionService,
    auditService,
  );
  const redisCacheService = new RedisCacheService();
  const chatFileService = new ChatFileService(
    chatDocumentRepository,
    storageAdapter,
    vectorAdapter,
    ingestionService,
    redisCacheService,
    auditService,
  );
  const ragService = new RagService(vectorAdapter, documentRepository, chatDocumentRepository, redisCacheService, auditService, telemetryService);
  const settingsService = new SettingsService(userRepository, env);
  const chatService = new ChatService(memoryService, ragService);

  container.bind("AuditService", () => auditService);
  container.bind("AnalyticsService", () => analyticsService);
  container.bind("AuthService", () => authService);
  container.bind("CampaignService", () => campaignService);
  container.bind("ChatService", () => chatService);
  container.bind("CustomerService", () => customerService);
  container.bind("ChatFileService", () => chatFileService);
  container.bind("MemoryService", () => memoryService);
  container.bind("RagService", () => ragService);
  container.bind("RedisCacheService", () => redisCacheService);
  container.bind("SettingsService", () => settingsService);
  container.bind("TelemetryService", () => telemetryService);
  container.bind("EmailService", () => emailService);
  container.bind("UploadService", () => uploadService);
  container.bind("AnalyticsController", () => new AnalyticsController(analyticsService));
  container.bind("AuditController", () => new AuditController(auditService));
  container.bind("AuthController", () => new AuthController(authService));
  container.bind("CampaignController", () => new CampaignController(campaignService));
  container.bind(
    "ChatController",
    () =>
      new ChatController(
        chatService,
        customerService,
        campaignService,
        analyticsService,
        ragService,
        memoryService,
        chatDocumentRepository,
        auditService,
      ),
  );
  container.bind("CustomerController", () => new CustomerController(customerService));
  container.bind("ChatFileController", () => new ChatFileController(chatFileService));
  container.bind("SettingsController", () => new SettingsController(settingsService));
  container.bind("UploadController", () => new UploadController(uploadService));
  registerAllJobs();

  return container;
}

export async function ensureBootstrap(): Promise<typeof container> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap();
  }

  return bootstrapPromise;
}
