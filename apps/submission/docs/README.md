# PCGL Submission Server

The PCGL Submission server is an ExpressJS server application that is build on top of the Overture Lyric's [provider package](https://github.com/overture-stack/lyric/tree/main/packages/data-provider). This allows the Submission server to import all of Lyric's functionality, such as its submission system and data retrieval, while also providing custom functionality for Study and DAC management, and custom authorization handling.

## Customizations
- AuthZ Integration
- Study and DAC Service
- Internal ID Management
- [External Validation](./external-validation.md)