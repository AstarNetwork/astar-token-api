import { validateDeveloperLinks } from '../../src/controllers/DappsStakingController';
import { Developer } from '../../src/models/Dapp';

describe('validateDeveloperLinks', () => {
    let developer: Developer;

    beforeEach(() => {
        developer = {
            name: 'Test',
            iconFile: '',
            twitterAccountUrl: '',
            linkedInAccountUrl: '',
        };
    });

    it('passes if developer has valid LinkedIn link', () => {
        developer.linkedInAccountUrl = 'https://test.com';

        expect(validateDeveloperLinks(developer)).toBeTruthy();
    });

    it('passes if developer has valid Twitter link', () => {
        developer.twitterAccountUrl = 'https://test.com';

        expect(validateDeveloperLinks(developer)).toBeTruthy();
    });

    it('passes if developer has both valid links', () => {
        developer.linkedInAccountUrl = 'https://test.com';
        developer.twitterAccountUrl = 'http://one.com';

        expect(validateDeveloperLinks(developer)).toBeTruthy();
    });

    it('fails if developer has invalid Twitter link', () => {
        developer.linkedInAccountUrl = 'https://test.com';
        developer.twitterAccountUrl = 'invalid';

        expect(validateDeveloperLinks(developer)).toBeFalsy();
    });

    it('fails if developer has invalid LinkedIn link', () => {
        developer.twitterAccountUrl = 'https://test.com';
        developer.linkedInAccountUrl = 'invalid';

        expect(validateDeveloperLinks(developer)).toBeFalsy();
    });

    it('fails if links are empty', () => {
        expect(validateDeveloperLinks(developer)).toBeFalsy();
    });
});
