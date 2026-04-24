const ComponentType = {
    ActionRow: 1,
    Button: 2,
    StringSelect: 3,
    Section: 9,
    TextDisplay: 10,
    Separator: 14,
    Container: 17
};

export async function execute(message) {
    if (message.author.bot || message.content !== '!test') return;

    const payload = {
        flags: 32768, 
        components: [
            {
                type: ComponentType.Container,
                accent_color: 0x5865F2,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: "## Main Control Card\nSelect an option and use the toggle below."
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.StringSelect,
                                custom_id: "card_selector",
                                placeholder: "Choose a category...",
                                options: [
                                    { label: "General", value: "gen" },
                                    { label: "Administrative", value: "admin" }
                                ]
                            }
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: 3, // Secondary (Grey)
                                label: "Updates",
                                custom_id: "toggle_extra_card"
                            },
                            {
                                type: ComponentType.Button,
                                style: 3, // Success (Green)
                                label: "Plans",
                                custom_id: "v2_save",
                            },
                            {
                                type: ComponentType.Button,
                                style: 4, // Danger (Red)
                                label: "Impedements",
                                custom_id: "v2_reset",
                            }
                        ]
                    }
                ]
            }
        ]
    };

    await message.channel.send(payload);
}