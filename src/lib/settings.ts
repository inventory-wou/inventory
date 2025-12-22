import { prisma } from './prisma';

// Default settings values
export const DEFAULT_SETTINGS = {
    late_return_ban_months: '6',
    late_return_auto_ban: 'true',
    default_max_borrow_days: '7',
    reminder_3days_enabled: 'true',
    reminder_1day_enabled: 'true',
    overdue_reminder_enabled: 'true',
    email_sender_name: 'Inventory System',
    email_footer_text: 'Woxsen University Inventory Management',
    max_items_per_user: '3',
    consumable_min_stock_alert: '10',
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export interface Setting {
    key: string;
    value: string;
    description?: string;
}

export interface SettingsMap {
    [key: string]: string;
}

/**
 * Get all settings with defaults for missing keys
 */
export async function getAllSettings(): Promise<SettingsMap> {
    try {
        const settings = await prisma.settings.findMany();

        const settingsMap: SettingsMap = { ...DEFAULT_SETTINGS };

        // Override defaults with database values
        settings.forEach((setting) => {
            settingsMap[setting.key] = setting.value;
        });

        return settingsMap;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * Get a specific setting value with fallback to default
 */
export async function getSettingValue(
    key: SettingKey,
    defaultValue?: string
): Promise<string> {
    try {
        const setting = await prisma.settings.findUnique({
            where: { key },
        });

        if (setting) {
            return setting.value;
        }

        // Return provided default or system default
        return defaultValue ?? DEFAULT_SETTINGS[key] ?? '';
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return defaultValue ?? DEFAULT_SETTINGS[key] ?? '';
    }
}

/**
 * Update a single setting
 */
export async function updateSetting(
    key: string,
    value: string,
    description?: string
): Promise<void> {
    try {
        await prisma.settings.upsert({
            where: { key },
            update: {
                value,
                description: description ?? null,
            },
            create: {
                key,
                value,
                description: description ?? null,
            },
        });
    } catch (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
    }
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: Setting[]): Promise<void> {
    try {
        await Promise.all(
            settings.map((setting) =>
                updateSetting(setting.key, setting.value, setting.description)
            )
        );
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}

/**
 * Get settings by category (based on key prefix)
 */
export async function getSettingsByCategory(
    category: string
): Promise<SettingsMap> {
    try {
        const allSettings = await getAllSettings();
        const filteredSettings: SettingsMap = {};

        Object.keys(allSettings).forEach((key) => {
            if (key.startsWith(category)) {
                filteredSettings[key] = allSettings[key];
            }
        });

        return filteredSettings;
    } catch (error) {
        console.error(`Error fetching settings for category ${category}:`, error);
        return {};
    }
}

/**
 * Reset all settings to defaults
 */
export async function resetToDefaults(): Promise<void> {
    try {
        await prisma.settings.deleteMany({});
    } catch (error) {
        console.error('Error resetting settings:', error);
        throw error;
    }
}

/**
 * Helper functions for typed setting values
 */
export function getNumberValue(value: string, fallback: number): number {
    const num = parseInt(value, 10);
    return isNaN(num) ? fallback : num;
}

export function getBooleanValue(value: string): boolean {
    return value === 'true';
}
