# External Validation Customization

The standard External Validation controller that Lyric provided has been replaced to accomodate the PCGL model for Study and Category management.

PCGL is using a model where a unique data dictionary is being created for every study, while the original Lyric external Validation system was built to accomodate a small number of known categories. Since the study management system requires that every category has its own study, the default validation system would require a different URL (with a different category ID) for every study. However, we can lookup the category ID from the Study ID.

Our objective is to allow PCGL File Manager to check for registered records when analyses are created, and this process will know the Study ID, but not the Category ID from the Submission Server. Therefore, we modified the path of the External Validation URL to use the Study ID only, and omit the Category ID.

Additionally, because we are creating many categories dynamically, instead of only doing this rarely during setup of our project, we can't use the environment configuration process for enabling external validation. We need external validation to be available for every category. So for PCGL Submission server we are making all categories and all entities have external validation enabled.

## External Valdiation Details

External validation is available at the path:

```
https://{{host}}/validation/entity/{{entityName}}/field/{{fieldName}}/exists?study={{studyName}}&value={{fieldValue}}
```

### File Manager Configuration

The main user of external validation is the File Manager. Before any analysis can be registered, File Manager will check that the data it is related to has already been registered in the Submission Server. The specific field that will be validated could change for each analysis type, and therefore the configuration for external validation is done separately for every Analysis Type's schema.

How to setup external validation for File Manager is documented in its [github code repository](https://github.com/Pan-Canadian-Genome-Library/file-manager/blob/develop/docs/custom-schemas.md#external-validation).

An example configuration, to check the `participant.participant_submitter_id` that is stored in the analysis document as the value `submitter_id` would be done with:

```json
{
	"url": "https://example.com/validation/entity/participant/field/participant_submitter_id/exists?study={study}&value={value}",
	"jsonPath": "submitter_id"
}
```

Note: you will need to replace `example.com` with the actual host of the submission server.