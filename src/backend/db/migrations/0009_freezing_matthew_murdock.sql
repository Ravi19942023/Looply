CREATE INDEX "chat_documents_chat_id_idx" ON "chat_documents" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_documents_actor_id_idx" ON "chat_documents" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "chat_artifact_versions_artifact_id_idx" ON "chat_artifact_versions" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "chat_artifacts_chat_id_idx" ON "chat_artifacts" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_artifacts_actor_id_idx" ON "chat_artifacts" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_idx" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_streams_chat_id_idx" ON "chat_streams" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chats_actor_id_idx" ON "chats" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "documents_actor_id_idx" ON "documents" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "conversation_messages_session_id_idx" ON "conversation_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "telemetry_logs_actor_id_idx" ON "telemetry_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "telemetry_logs_chat_id_idx" ON "telemetry_logs" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "tool_logs_chat_id_idx" ON "tool_logs" USING btree ("chat_id");