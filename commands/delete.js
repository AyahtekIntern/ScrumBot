import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import * as deleteHandler from "../interactions/deleteHandler.js";

export const data = new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Delete reports within a specified date range")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false);

export async function execute(interaction) {
    await deleteHandler.showDeleteModal(interaction);
}